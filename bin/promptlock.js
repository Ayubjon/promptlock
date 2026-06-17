#!/usr/bin/env node
import { resolve } from 'node:path'
import { init, check, update, formatDiff } from '../src/index.js'

const HELP = `
promptlock — lock your LLM prompt files against accidental changes

Usage:
  promptlock init   [dir] [--ext .md] [--ext .txt]
  promptlock check  [dir] [--ext .md] [--ext .txt]
  promptlock update [dir] [--ext .md] [--ext .txt]
  promptlock status [dir] [--ext .md] [--ext .txt]

Commands:
  init    Scan for prompt files and create .promptlock.json (first-time setup)
  check   Verify prompt files match the lockfile — exits 1 if changed (use in CI)
  update  Refresh .promptlock.json to reflect intentional prompt changes
  status  Show which prompts have changed without failing (alias: diff)

Options:
  --ext <ext>   Additional file extension to track (default: .prompt)
                Can be repeated: --ext .md --ext .txt
  --no-color    Disable colored output
  -h, --help    Show this help

Examples:
  promptlock init                     # lock all *.prompt files in current dir
  promptlock init prompts/ --ext .md  # also lock *.md in prompts/
  promptlock check                    # CI step: fail if any prompt changed
  promptlock update                   # after intentional prompt edits
`.trim()

function parseArgs(argv) {
  const args = { command: null, dir: '.', exts: ['.prompt'], color: true }
  let i = 0
  while (i < argv.length) {
    const a = argv[i]
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
    if (a === '--no-color') { args.color = false; i++; continue }
    if (a === '--ext') { args.exts.push(argv[++i]); i++; continue }
    if (a.startsWith('--ext=')) { args.exts.push(a.slice(6)); i++; continue }
    if (!args.command) { args.command = a; i++; continue }
    args.dir = a; i++
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const dir = resolve(args.dir)
const exts = [...new Set(args.exts)]

if (!args.command || args.command === 'help') {
  console.log(HELP)
  process.exit(0)
}

try {
  if (args.command === 'init') {
    const { count } = init(dir, exts)
    console.log(`✓ Locked ${count} prompt file${count === 1 ? '' : 's'} in .promptlock.json`)

  } else if (args.command === 'check') {
    const diffs = check(dir, exts)
    if (diffs.length === 0) {
      console.log(formatDiff([], { color: args.color }))
      process.exit(0)
    } else {
      console.error(`\n  Prompt lockfile mismatch — ${diffs.length} file${diffs.length === 1 ? '' : 's'} changed:\n`)
      console.error(formatDiff(diffs, { color: args.color }))
      console.error('\n  Run \`promptlock update\` to accept these changes.\n')
      process.exit(1)
    }

  } else if (args.command === 'update') {
    const { count } = update(dir, exts)
    console.log(`✓ Updated .promptlock.json — ${count} prompt file${count === 1 ? '' : 's'} locked`)

  } else if (args.command === 'status' || args.command === 'diff') {
    const diffs = check(dir, exts)
    console.log(formatDiff(diffs, { color: args.color }))

  } else {
    console.error(`Unknown command: ${args.command}\n`)
    console.log(HELP)
    process.exit(1)
  }
} catch (err) {
  console.error(`Error: ${err.message}`)
  process.exit(1)
}
