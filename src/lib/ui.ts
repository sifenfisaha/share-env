import { diffLines } from 'diff'
import pc from 'picocolors'
import type { EnvDiff } from './env.js'

export function truncate(value: string, max = 42): string {
  return value.length > max ? value.slice(0, max - 1) + '…' : value
}

/** Render the per-variable summary shown when a file conflicts. */
export function renderEnvDiff(diff: EnvDiff): string {
  const lines: string[] = []
  for (const key of diff.added) {
    lines.push(`${pc.green('+')} ${pc.green(key)}  ${pc.dim('new from vault')}`)
  }
  for (const { key, local, incoming } of diff.changed) {
    lines.push(
      `${pc.yellow('~')} ${pc.yellow(key)}  ${pc.red(truncate(local))} ${pc.dim('→')} ${pc.green(truncate(incoming))}`
    )
  }
  for (const key of diff.localOnly) {
    lines.push(`${pc.red('-')} ${pc.red(key)}  ${pc.dim('only in your local file')}`)
  }
  return lines.join('\n')
}

/** Classic colored full-file diff (local -> incoming). */
export function renderFileDiff(local: string, incoming: string): string {
  const parts = diffLines(local, incoming)
  const out: string[] = []
  for (const part of parts) {
    const lines = part.value.replace(/\n$/, '').split('\n')
    for (const line of lines) {
      if (part.added) out.push(pc.green(`+ ${line}`))
      else if (part.removed) out.push(pc.red(`- ${line}`))
      else out.push(pc.dim(`  ${line}`))
    }
  }
  return out.join('\n')
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
