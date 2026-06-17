import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

export function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

export function hashFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  return {
    hash: hashContent(content),
    lines: content.split('\n').length,
    chars: content.length,
  }
}
