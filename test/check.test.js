import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diffLocks, formatDiff } from '../src/check.js'

const mkEntry = (hash, lines = 3, chars = 50) => ({ hash, lines, chars })

const locked = {
  version: 1,
  entries: {
    'prompts/system.prompt': mkEntry('aaaa'),
    'prompts/user.prompt': mkEntry('bbbb'),
    'prompts/old.prompt': mkEntry('cccc'),
  },
}

const current = {
  version: 1,
  entries: {
    'prompts/system.prompt': mkEntry('aaaa'),         // unchanged
    'prompts/user.prompt': mkEntry('xxxx', 5, 80),    // modified
    'prompts/new.prompt': mkEntry('dddd'),             // added
    // old.prompt is missing → deleted
  },
}

test('diffLocks returns empty array when nothing changed', () => {
  const same = { version: 1, entries: { 'a.prompt': mkEntry('abc') } }
  const result = diffLocks(same, same)
  assert.deepEqual(result, [])
})

test('diffLocks detects modified file', () => {
  const diffs = diffLocks(locked, current)
  const mod = diffs.find(d => d.file === 'prompts/user.prompt')
  assert.ok(mod, 'modified entry not found')
  assert.equal(mod.type, 'modified')
  assert.equal(mod.oldHash, 'bbbb')
  assert.equal(mod.newHash, 'xxxx')
})

test('diffLocks detects deleted file', () => {
  const diffs = diffLocks(locked, current)
  const del = diffs.find(d => d.file === 'prompts/old.prompt')
  assert.ok(del, 'deleted entry not found')
  assert.equal(del.type, 'deleted')
})

test('diffLocks detects added file', () => {
  const diffs = diffLocks(locked, current)
  const add = diffs.find(d => d.file === 'prompts/new.prompt')
  assert.ok(add, 'added entry not found')
  assert.equal(add.type, 'added')
})

test('diffLocks unchanged files are not in result', () => {
  const diffs = diffLocks(locked, current)
  assert.ok(!diffs.find(d => d.file === 'prompts/system.prompt'))
})

test('diffLocks result is sorted by filename', () => {
  const diffs = diffLocks(locked, current)
  const files = diffs.map(d => d.file)
  assert.deepEqual(files, [...files].sort())
})

test('formatDiff produces human-readable output', () => {
  const diffs = diffLocks(locked, current)
  const out = formatDiff(diffs)
  assert.ok(out.includes('modified'))
  assert.ok(out.includes('deleted'))
  assert.ok(out.includes('added'))
  assert.ok(out.includes('prompts/user.prompt'))
})

test('formatDiff returns clean message when no diffs', () => {
  const out = formatDiff([])
  assert.ok(out.includes('up to date') || out.includes('no changes') || out.includes('clean'))
})
