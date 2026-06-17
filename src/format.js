export function formatJson(data) {
  return JSON.stringify(data, null, 2)
}

export function formatList(lock) {
  const entries = Object.entries(lock.entries)
  if (entries.length === 0) return 'No prompt files tracked.'
  return entries
    .map(([file, info]) => `${info.hash.slice(0, 8)}  ${info.lines.toString().padStart(4)} lines  ${file}`)
    .join('\n')
}
