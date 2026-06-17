import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatJson, formatList } from '../src/format.js'

const lock = {
  version: 1,
  entries: {
    'prompts/system.prompt': { hash: 'abc123', lines: 4, chars: 100 },
    'prompts/user.prompt': { hash: 'def456', lines: 2, chars: 50 },
  },
}

test('formatJson produces valid JSON string', () => {
  const out = formatJson({ ok: true, diffs: [] })
  assert.doesNotThrow(() => JSON.parse(out))
  const parsed = JSON.parse(out)
  assert.equal(parsed.ok, true)
})

test('formatJson includes all fields', () => {
  const diffs = [{ file: 'a.prompt', type: 'modified', oldHash: 'aaa', newHash: 'bbb' }]
  const parsed = JSON.parse(formatJson({ ok: false, diffs }))
  assert.equal(parsed.ok, false)
  assert.equal(parsed.diffs[0].file, 'a.prompt')
})

test('formatList outputs one line per file', () => {
  const out = formatList(lock)
  const lines = out.trim().split('\n')
  assert.equal(lines.length, 2)
})

test('formatList includes filename', () => {
  const out = formatList(lock)
  assert.ok(out.includes('prompts/system.prompt'))
  assert.ok(out.includes('prompts/user.prompt'))
})

test('formatList includes hash prefix', () => {
  const out = formatList(lock)
  assert.ok(out.includes('abc123'))
})

test('formatList shows empty message for empty lock', () => {
  const out = formatList({ version: 1, entries: {} })
  assert.ok(out.includes('No') || out.includes('empty') || out.length === 0)
})
