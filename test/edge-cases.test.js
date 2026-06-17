import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { init, check, update } from '../src/index.js'
import { diffLocks } from '../src/check.js'

const tmp = join(tmpdir(), 'promptlock-edge-test-' + process.pid)
mkdirSync(join(tmp, 'prompts'), { recursive: true })

test('init on empty directory returns count 0', () => {
  const empty = join(tmp, 'empty')
  mkdirSync(empty, { recursive: true })
  const { count } = init(empty)
  assert.equal(count, 0)
})

test('check on directory with no prompts after init returns empty diffs', () => {
  const empty = join(tmp, 'empty2')
  mkdirSync(empty, { recursive: true })
  init(empty)
  const diffs = check(empty)
  assert.deepEqual(diffs, [])
})

test('adding a new prompt file after init shows as added', () => {
  const d = join(tmp, 'add-test')
  mkdirSync(join(d, 'p'), { recursive: true })
  writeFileSync(join(d, 'p', 'existing.prompt'), 'hello')
  init(d)
  writeFileSync(join(d, 'p', 'new.prompt'), 'world')
  const diffs = check(d)
  assert.equal(diffs.length, 1)
  assert.equal(diffs[0].type, 'added')
})

test('deleting a prompt file after init shows as deleted', () => {
  const d = join(tmp, 'del-test')
  mkdirSync(join(d, 'p'), { recursive: true })
  writeFileSync(join(d, 'p', 'a.prompt'), 'content a')
  writeFileSync(join(d, 'p', 'b.prompt'), 'content b')
  init(d)
  rmSync(join(d, 'p', 'b.prompt'))
  const diffs = check(d)
  assert.equal(diffs.length, 1)
  assert.equal(diffs[0].type, 'deleted')
  assert.equal(diffs[0].file, 'p/b.prompt')
})

test('whitespace-only change in prompt is detected', () => {
  const d = join(tmp, 'ws-test')
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'sys.prompt'), 'Be helpful.')
  init(d)
  writeFileSync(join(d, 'sys.prompt'), 'Be helpful. ')  // trailing space
  const diffs = check(d)
  assert.equal(diffs.length, 1)
  assert.equal(diffs[0].type, 'modified')
})

test('update after delete removes the file from the lock', () => {
  const d = join(tmp, 'upd-del-test')
  mkdirSync(d, { recursive: true })
  writeFileSync(join(d, 'keep.prompt'), 'keep me')
  writeFileSync(join(d, 'remove.prompt'), 'remove me')
  init(d)
  rmSync(join(d, 'remove.prompt'))
  update(d)
  const diffs = check(d)
  assert.deepEqual(diffs, [])
})

test('diffLocks handles completely different entry sets', () => {
  const a = { version: 1, entries: { 'x.prompt': { hash: '111', lines: 1, chars: 5 } } }
  const b = { version: 1, entries: { 'y.prompt': { hash: '222', lines: 2, chars: 10 } } }
  const diffs = diffLocks(a, b)
  assert.equal(diffs.length, 2)
  assert.ok(diffs.find(d => d.type === 'deleted' && d.file === 'x.prompt'))
  assert.ok(diffs.find(d => d.type === 'added' && d.file === 'y.prompt'))
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
