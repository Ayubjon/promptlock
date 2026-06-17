export function diffLocks(locked, current) {
  const diffs = []

  for (const [file, info] of Object.entries(locked.entries)) {
    if (!current.entries[file]) {
      diffs.push({ file, type: 'deleted', oldHash: info.hash, newHash: null, oldLines: info.lines, newLines: null })
    } else if (current.entries[file].hash !== info.hash) {
      const cur = current.entries[file]
      diffs.push({ file, type: 'modified', oldHash: info.hash, newHash: cur.hash, oldLines: info.lines, newLines: cur.lines })
    }
  }

  for (const [file, info] of Object.entries(current.entries)) {
    if (!locked.entries[file]) {
      diffs.push({ file, type: 'added', oldHash: null, newHash: info.hash, oldLines: null, newLines: info.lines })
    }
  }

  return diffs.sort((a, b) => a.file.localeCompare(b.file))
}

const SYMBOLS = { modified: '~', deleted: '-', added: '+' }
const COLORS = { modified: '\x1b[33m', deleted: '\x1b[31m', added: '\x1b[32m', reset: '\x1b[0m' }

export function formatDiff(diffs, { color = true } = {}) {
  if (diffs.length === 0) {
    return color
      ? `${COLORS.added}✓${COLORS.reset} All prompts are up to date.`
      : '✓ All prompts are up to date.'
  }

  const lines = diffs.map(d => {
    const sym = SYMBOLS[d.type]
    const col = color ? COLORS[d.type] : ''
    const rst = color ? COLORS.reset : ''
    let detail = ''
    if (d.type === 'modified') {
      detail = ` (${d.oldLines} → ${d.newLines} lines)`
    } else if (d.type === 'deleted') {
      detail = ` (${d.oldLines} lines removed)`
    } else {
      detail = ` (${d.newLines} lines)`
    }
    return `  ${col}${sym} ${d.type.padEnd(8)}${rst} ${d.file}${detail}`
  })

  const counts = diffs.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc }, {})
  const summary = Object.entries(counts)
    .map(([t, n]) => `${n} ${t}`)
    .join(', ')

  return lines.join('\n') + `\n\n  ${summary}`
}
