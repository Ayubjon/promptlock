import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadConfig, DEFAULT_CONFIG } from '../src/config.js'

const tmp = join(tmpdir(), 'promptlock-config-test-' + process.pid)
mkdirSync(tmp, { recursive: true })

test('DEFAULT_CONFIG has expected shape', () => {
  assert.ok(Array.isArray(DEFAULT_CONFIG.extensions))
  assert.ok(DEFAULT_CONFIG.extensions.includes('.prompt'))
  assert.ok(Array.isArray(DEFAULT_CONFIG.exclude))
})

test('loadConfig returns defaults when no config file', () => {
  const cfg = loadConfig(join(tmp, 'noconfig'))
  assert.deepEqual(cfg.extensions, DEFAULT_CONFIG.extensions)
})

test('loadConfig reads .promptlockrc.json', () => {
  const dir = join(tmp, 'has-rc')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '.promptlockrc.json'), JSON.stringify({
    extensions: ['.prompt', '.md'],
    exclude: ['vendor'],
  }))
  const cfg = loadConfig(dir)
  assert.deepEqual(cfg.extensions, ['.prompt', '.md'])
  assert.ok(cfg.exclude.includes('vendor'))
})

test('loadConfig reads promptlock key from package.json', () => {
  const dir = join(tmp, 'pkg-json')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'myapp',
    promptlock: { extensions: ['.txt'] },
  }))
  const cfg = loadConfig(dir)
  assert.deepEqual(cfg.extensions, ['.txt'])
})

test('.promptlockrc.json takes precedence over package.json', () => {
  const dir = join(tmp, 'precedence')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ promptlock: { extensions: ['.txt'] } }))
  writeFileSync(join(dir, '.promptlockrc.json'), JSON.stringify({ extensions: ['.prompt'] }))
  const cfg = loadConfig(dir)
  assert.deepEqual(cfg.extensions, ['.prompt'])
})

test('loadConfig ignores invalid JSON gracefully', () => {
  const dir = join(tmp, 'bad-json')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '.promptlockrc.json'), 'not valid json {{{')
  const cfg = loadConfig(dir)
  assert.deepEqual(cfg.extensions, DEFAULT_CONFIG.extensions)
})

test.after(() => rmSync(tmp, { recursive: true, force: true }))
