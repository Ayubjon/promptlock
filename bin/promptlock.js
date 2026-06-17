#!/usr/bin/env node
import { resolve } from 'node:path'
import { init, check, update, formatDiff, readLockfile } from '../src/index.js'
import { loadConfig } from '../src/config.js'
import { formatJson, formatList } from '../src/format.js'

const HELP = `
promptlock — lock your LLM prompt files against accidental changes

Usage:
  promptlock init   [dir] [options]
  promptlock check  [dir] [options]
  promptlock update [dir] [options]
  promptlock status [dir] [options]
  promptlock list   [dir] [options]

Commands:
  init    Scan for prompt files and create .promptlock.json (first-time setup)
  check   Verify prompt files match the lockfile — exits 1 if changed (use in CI)
  update  Refresh .promptlock.json to reflect intentional prompt changes
  status  Show which prompts have changed without failing (alias: diff)
  list    List all currently locked prompt files

Options:
  --ext <ext>   Additional file extension to track (default: .prompt)
                Can be repeated: --ext .md --ext .txt
  --json        Output machine-readable JSON
  --no-color    Disable colored output
  -h, --help    Show this help

Config:
  Create .promptlockrc.json or add a "promptlock" key in package.json:
    { "extensions": [".prompt", ".md"], "exclude": ["vendor"] }

Examples:
  promptlock init                     # lock all *.prompt files in current dir
  promptlock init prompts/ --ext .md  # also lock *.md in prompts/
  promptlock check                    # CI step: fail if any prompt changed
  promptlock check --json             # machine-readable output for pipelines
  promptlock update                   # after intentional prompt edits
  promptlock list                     # show all tracked files and their hashes
`.trim()

function parseArgs(argv) {
  const args = { command: null, dir: '.', exts: [], color: true, json: false }
  let i = 0
  while (i < argv.length) {
    const a = argv[i]
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
    if (a === '--no-color') { args.color = false; i++; continue }
    if (a === '--json') { args.json = true; i++; continue }
    if (a === '--ext') { args.exts.push(argv[++i]); i++; continue }
    if (a.startsWith('--ext=')) { args.exts.push(a.slice(6)); i++; continue }
    if (!args.command) { args.command = a; i++; continue }
    args.dir = a; i++
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const dir = resolve(args.dir)

// Load config, then merge CLI --ext overrides
const cfg = loadConfig(dir)
const exts = args.exts.length > 0
  ? [...new Set([...cfg.extensions, ...args.exts])]
  : cfg.extensions

if (!args.command || args.command === 'help') {
  console.log(HELP)
  process.exit(0)
}

try {
  if (args.command === 'init') {
    const { count, lock } = init(dir, exts)
    if (args.json) {
      console.log(formatJson({ ok: true, count, entries: lock.entries }))
    } else {
      console.log(`✓ Locked ${count} prompt file${count === 1 ? '' : 's'} in .promptlock.json`)
    }

  } else if (args.command === 'check') {
    const diffs = check(dir, exts)
    if (args.json) {
      console.log(formatJson({ ok: diffs.length === 0, diffs }))
      process.exit(diffs.length === 0 ? 0 : 1)
    }
    if (diffs.length === 0) {
      console.log(formatDiff([], { color: args.color }))
      process.exit(0)
    } else {
      console.error(`\n  Prompt lockfile mismatch — ${diffs.length} file${diffs.length === 1 ? '' : 's'} changed:\n`)
      console.error(formatDiff(diffs, { color: args.color }))
      console.error('\n  Run `promptlock update` to accept these changes.\n')
      process.exit(1)
    }

  } else if (args.command === 'update') {
    const { count, lock } = update(dir, exts)
    if (args.json) {
      console.log(formatJson({ ok: true, count, entries: lock.entries }))
    } else {
      console.log(`✓ Updated .promptlock.json — ${count} prompt file${count === 1 ? '' : 's'} locked`)
    }

  } else if (args.command === 'status' || args.command === 'diff') {
    const diffs = check(dir, exts)
    if (args.json) {
      console.log(formatJson({ ok: diffs.length === 0, diffs }))
    } else {
      console.log(formatDiff(diffs, { color: args.color }))
    }

  } else if (args.command === 'list') {
    const lock = readLockfile(dir)
    if (!lock) throw new Error('No .promptlock.json found. Run `promptlock init` first.')
    if (args.json) {
      console.log(formatJson(lock))
    } else {
      console.log(formatList(lock))
    }

  } else {
    console.error(`Unknown command: ${args.command}\n`)
    console.log(HELP)
    process.exit(1)
  }
} catch (err) {
  if (args.json) {
    console.error(formatJson({ ok: false, error: err.message }))
  } else {
    console.error(`Error: ${err.message}`)
  }
  process.exit(1)
}
