import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt'])

export function findPromptFiles(dir, extensions = ['.prompt'], excludeDirs = EXCLUDE_DIRS) {
  const results = []

  function walk(current) {
    let entries
    try {
      entries = readdirSync(current)
    } catch {
      return
    }
    for (const entry of entries) {
      if (excludeDirs.has(entry)) continue
      const full = join(current, entry)
      let stat
      try {
        stat = statSync(full)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
        walk(full)
      } else if (extensions.some(ext => entry.endsWith(ext))) {
        results.push(full)
      }
    }
  }

  walk(dir)
  return results.sort()
}
