import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readLockfile, writeLockfile, LOCKFILE_NAME } from '../src/lockfile.js'

const tmp = join(tmpdir(), 'promptlock-lf-test-' + process.pid)
mkdirSync(tmp, { recursive: true })

test('LOCKFILE_NAME is .promptlock.json', () => {
  assert.equal(LOCKFILE_NAME, '.promptlock.json')
})

test('readLockfile returns null when file does not exist', () => {
  const result = readLockfile(join(tmp, 'nonexistent'))
  assert.equal(result, null)
})

test('writeLockfile creates the lockfile', () => {
  const dir = join(tmp, 'write-test')
  mkdirSync(dir, { recursive: true })
  const data = { version: 1, entries: { 'foo.prompt': { hash: 'abc', lines: 1, chars: 10 } } }
  writeLockfile(dir, data)
  assert.ok(existsSync(join(dir, LOCKFILE_NAME)))
})

test('readLockfile reads back what was written', () => {
  const dir = join(tmp, 'roundtrip')
  mkdirSync(dir, { recursive: true })
  const data = {
    version: 1,
    entries: {
      'prompts/system.prompt': { hash: 'deadbeef', lines: 5, chars: 100 },
    },
  }
  writeLockfile(dir, data)
  const read = readLockfile(dir)
  assert.deepEqual(read.version, 1)
  assert.deepEqual(read.entries['prompts/system.prompt'].hash, 'deadbeef')
})

test('writeLockfile produces valid JSON', () => {
  const dir = join(tmp, 'json-test')
  mkdirSync(dir, { recursive: true })
  writeLockfile(dir, { version: 1, entries: {} })
  const raw = (await import('node:fs')).readFileSync(join(dir, LOCKFILE_NAME), 'utf8')
  assert.doesNotThrow(() => JSON.parse(raw))
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
