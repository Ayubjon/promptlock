import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_CONFIG = {
  extensions: ['.prompt'],
  exclude: ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt'],
}

function tryParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function loadConfig(dir) {
  // .promptlockrc.json takes highest precedence
  const rcPath = join(dir, '.promptlockrc.json')
  if (existsSync(rcPath)) {
    const parsed = tryParse(readFileSync(rcPath, 'utf8'))
    if (parsed) return { ...DEFAULT_CONFIG, ...parsed }
  }

  // fall back to package.json "promptlock" key
  const pkgPath = join(dir, 'package.json')
  if (existsSync(pkgPath)) {
    const pkg = tryParse(readFileSync(pkgPath, 'utf8'))
    if (pkg?.promptlock) return { ...DEFAULT_CONFIG, ...pkg.promptlock }
  }

  return { ...DEFAULT_CONFIG }
}
