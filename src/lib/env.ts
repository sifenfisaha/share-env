const LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/

/** Parse KEY=VALUE lines. Comments and blank lines are ignored; values are kept raw. */
export function parseEnv(src: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of src.split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue
    const m = LINE_RE.exec(line)
    if (m) map.set(m[1], m[2].trim())
  }
  return map
}

export interface EnvDiff {
  /** Keys only in the incoming file. */
  added: string[]
  /** Keys only in the local file. */
  localOnly: string[]
  /** Keys in both, with different values. */
  changed: { key: string; local: string; incoming: string }[]
}

export function diffEnv(local: Map<string, string>, incoming: Map<string, string>): EnvDiff {
  const diff: EnvDiff = { added: [], localOnly: [], changed: [] }
  for (const [key, value] of incoming) {
    if (!local.has(key)) diff.added.push(key)
    else if (local.get(key) !== value)
      diff.changed.push({ key, local: local.get(key)!, incoming: value })
  }
  for (const key of local.keys()) {
    if (!incoming.has(key)) diff.localOnly.push(key)
  }
  return diff
}

export interface MergeDecisions {
  /** changed keys where the local value wins */
  useLocal: Map<string, string>
  /** incoming-only keys the user declined */
  dropIncoming: Set<string>
  /** local-only keys the user wants to keep, in file order */
  keepLocalOnly: [string, string][]
}

/**
 * Build the merged file: incoming text is the base (so teammate comments and
 * ordering survive), with local values substituted where chosen and kept
 * local-only keys appended at the end.
 */
export function buildMerged(incomingRaw: string, decisions: MergeDecisions): string {
  const lines = incomingRaw.split(/\r?\n/)
  const merged: string[] = []
  for (const line of lines) {
    const m = LINE_RE.exec(line)
    if (m && !line.trim().startsWith('#')) {
      const key = m[1]
      if (decisions.dropIncoming.has(key)) continue
      if (decisions.useLocal.has(key)) {
        merged.push(`${key}=${decisions.useLocal.get(key)}`)
        continue
      }
    }
    merged.push(line)
  }
  if (decisions.keepLocalOnly.length > 0) {
    if (merged[merged.length - 1]?.trim() !== '') merged.push('')
    merged.push('# kept from local (not in the shared vault)')
    for (const [key, value] of decisions.keepLocalOnly) merged.push(`${key}=${value}`)
  }
  let result = merged.join('\n')
  if (!result.endsWith('\n')) result += '\n'
  return result
}
