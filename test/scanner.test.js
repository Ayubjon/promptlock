import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { findPromptFiles } from '../src/scanner.js'

const tmp = join(tmpdir(), 'promptlock-scanner-test-' + process.pid)

test.before(() => {
  mkdirSync(join(tmp, 'prompts', 'sub'), { recursive: true })
  mkdirSync(join(tmp, 'node_modules', 'foo'), { recursive: true })
  mkdirSync(join(tmp, '.git'), { recursive: true })
  writeFileSync(join(tmp, 'prompts', 'system.prompt'), 'system prompt')
  writeFileSync(join(tmp, 'prompts', 'user.prompt'), 'user prompt')
  writeFileSync(join(tmp, 'prompts', 'sub', 'nested.prompt'), 'nested')
  writeFileSync(join(tmp, 'prompts', 'notes.md'), 'some notes')
  writeFileSync(join(tmp, 'node_modules', 'foo', 'not-a-prompt.prompt'), 'should be excluded')
  writeFileSync(join(tmp, '.git', 'hook.prompt'), 'should be excluded')
  writeFileSync(join(tmp, 'unrelated.js'), 'js file')
})

test('finds .prompt files recursively', () => {
  const files = findPromptFiles(tmp, ['.prompt'])
  const rels = files.map(f => f.replace(tmp + '/', ''))
  assert.ok(rels.includes('prompts/system.prompt'))
  assert.ok(rels.includes('prompts/user.prompt'))
  assert.ok(rels.includes('prompts/sub/nested.prompt'))
})

test('excludes node_modules by default', () => {
  const files = findPromptFiles(tmp, ['.prompt'])
  assert.ok(!files.some(f => f.includes('node_modules')))
})

test('excludes .git by default', () => {
  const files = findPromptFiles(tmp, ['.prompt'])
  assert.ok(!files.some(f => f.includes('/.git/')))
})

test('respects extension filter', () => {
  const files = findPromptFiles(tmp, ['.md'])
  const rels = files.map(f => f.replace(tmp + '/', ''))
  assert.ok(rels.includes('prompts/notes.md'))
  assert.ok(!rels.some(r => r.endsWith('.prompt')))
})

test('multi-extension filter', () => {
  const files = findPromptFiles(tmp, ['.prompt', '.md'])
  assert.equal(files.filter(f => f.endsWith('.prompt')).length, 3)
  assert.equal(files.filter(f => f.endsWith('.md')).length, 1)
})

test('returns empty array when no matches', () => {
  const files = findPromptFiles(tmp, ['.xyz'])
  assert.deepEqual(files, [])
})

test('returns sorted paths', () => {
  const files = findPromptFiles(tmp, ['.prompt'])
  const sorted = [...files].sort()
  assert.deepEqual(files, sorted)
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
