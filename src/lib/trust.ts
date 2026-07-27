import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Local record of recipient keys this machine has explicitly approved
 * (via keys add / keygen, or by confirming at push time). Lives inside
 * .git so it is never committed and can never be modified by a pull
 * request — which is the whole point: it lets push detect roster entries
 * that arrived any other way.
 */
function storePath(root: string): string | null {
  const gitDir = join(root, '.git')
  try {
    // .git is a plain file in worktrees/submodules; skip the store there.
    if (statSync(gitDir).isDirectory()) return join(gitDir, 'share-env-trusted-keys')
  } catch {
    // no .git at all
  }
  return null
}

export function readTrustedKeys(root: string): Set<string> {
  const path = storePath(root)
  if (!path || !existsSync(path)) return new Set()
  return new Set(
    readFileSync(path, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  )
}

export function trustKeys(root: string, publicKeys: string[]): void {
  const path = storePath(root)
  if (!path) return
  const keys = readTrustedKeys(root)
  for (const key of publicKeys) keys.add(key)
  writeFileSync(path, [...keys].join('\n') + '\n', 'utf8')
}

export function untrustKeys(root: string, publicKeys: string[]): void {
  const path = storePath(root)
  if (!path) return
  const keys = readTrustedKeys(root)
  for (const key of publicKeys) keys.delete(key)
  writeFileSync(path, [...keys].join('\n') + (keys.size ? '\n' : ''), 'utf8')
}
