import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { init, check, update, computeLock } from '../src/index.js'

const tmp = join(tmpdir(), 'promptlock-index-test-' + process.pid)

test.before(() => {
  mkdirSync(join(tmp, 'prompts'), { recursive: true })
  writeFileSync(join(tmp, 'prompts', 'system.prompt'), 'You are a helpful assistant.')
  writeFileSync(join(tmp, 'prompts', 'user.prompt'), 'Answer the following question: {{question}}')
})

test('computeLock builds entries with relative paths', () => {
  const files = [join(tmp, 'prompts', 'system.prompt')]
  const lock = computeLock(files, tmp)
  assert.ok(lock.entries['prompts/system.prompt'])
  assert.equal(typeof lock.entries['prompts/system.prompt'].hash, 'string')
})

test('init creates lockfile and returns count', () => {
  const result = init(tmp)
  assert.equal(result.count, 2)
  assert.ok(result.lock.entries['prompts/system.prompt'])
  assert.ok(result.lock.entries['prompts/user.prompt'])
})

test('check returns empty diffs when nothing changed', () => {
  init(tmp)
  const diffs = check(tmp)
  assert.deepEqual(diffs, [])
})

test('check detects modified prompt', () => {
  init(tmp)
  writeFileSync(join(tmp, 'prompts', 'system.prompt'), 'You are a different assistant.')
  const diffs = check(tmp)
  assert.equal(diffs.length, 1)
  assert.equal(diffs[0].type, 'modified')
  assert.equal(diffs[0].file, 'prompts/system.prompt')
})

test('update refreshes lock after changes', () => {
  const result = update(tmp)
  assert.equal(result.count, 2)
  const diffs = check(tmp)
  assert.deepEqual(diffs, [])
})

test('check throws when no lockfile', () => {
  const fresh = join(tmp, 'fresh')
  mkdirSync(fresh, { recursive: true })
  assert.throws(() => check(fresh), /init/)
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
