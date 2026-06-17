import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const LOCKFILE_NAME = '.promptlock.json'

export function readLockfile(dir) {
  const p = join(dir, LOCKFILE_NAME)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf8'))
}

export function writeLockfile(dir, data) {
  writeFileSync(join(dir, LOCKFILE_NAME), JSON.stringify(data, null, 2) + '\n')
}
