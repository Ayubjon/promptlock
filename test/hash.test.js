import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { hashContent, hashFile } from '../src/hash.js'

const tmp = join(tmpdir(), 'promptlock-hash-test-' + process.pid)
mkdirSync(tmp, { recursive: true })

test('hashContent returns 64-char hex string', () => {
  const h = hashContent('hello world')
  assert.equal(typeof h, 'string')
  assert.equal(h.length, 64)
  assert.match(h, /^[0-9a-f]+$/)
})

test('hashContent is deterministic', () => {
  assert.equal(hashContent('same text'), hashContent('same text'))
})

test('hashContent differs for different inputs', () => {
  assert.notEqual(hashContent('foo'), hashContent('bar'))
})

test('hashContent is sensitive to whitespace', () => {
  assert.notEqual(hashContent('hello'), hashContent('hello '))
  assert.notEqual(hashContent('hello\n'), hashContent('hello'))
})

test('hashFile returns hash, lines, chars for a file', () => {
  const f = join(tmp, 'test.prompt')
  writeFileSync(f, 'You are a helpful assistant.\nAnswer concisely.\n')
  const result = hashFile(f)
  assert.equal(typeof result.hash, 'string')
  assert.equal(result.hash.length, 64)
  assert.equal(result.lines, 3)   // 2 lines + trailing newline = 3 parts
  assert.equal(result.chars, 48)
})

test('hashFile detects content change', () => {
  const f = join(tmp, 'change.prompt')
  writeFileSync(f, 'original prompt text')
  const before = hashFile(f)
  writeFileSync(f, 'modified prompt text')
  const after = hashFile(f)
  assert.notEqual(before.hash, after.hash)
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
