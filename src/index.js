import { relative } from 'node:path'
import { hashFile } from './hash.js'
import { findPromptFiles } from './scanner.js'
import { readLockfile, writeLockfile, LOCKFILE_NAME } from './lockfile.js'
import { diffLocks, formatDiff } from './check.js'

export { hashContent, hashFile } from './hash.js'
export { loadConfig, DEFAULT_CONFIG } from './config.js'
export { formatJson, formatList } from './format.js'
export { findPromptFiles } from './scanner.js'
export { readLockfile, writeLockfile, LOCKFILE_NAME } from './lockfile.js'
export { diffLocks, formatDiff } from './check.js'

export function computeLock(files, baseDir) {
  const entries = {}
  for (const file of files) {
    const rel = relative(baseDir, file)
    entries[rel] = hashFile(file)
  }
  return { version: 1, entries }
}

export function init(dir, extensions = ['.prompt']) {
  const files = findPromptFiles(dir, extensions)
  const lock = computeLock(files, dir)
  writeLockfile(dir, lock)
  return { lock, count: files.length }
}

export function check(dir, extensions = ['.prompt']) {
  const locked = readLockfile(dir)
  if (!locked) throw new Error(`No ${LOCKFILE_NAME} found in ${dir}. Run \`promptlock init\` first.`)
  const files = findPromptFiles(dir, extensions)
  const current = computeLock(files, dir)
  return diffLocks(locked, current)
}

export function update(dir, extensions = ['.prompt']) {
  const files = findPromptFiles(dir, extensions)
  const lock = computeLock(files, dir)
  writeLockfile(dir, lock)
  return { lock, count: files.length }
}
