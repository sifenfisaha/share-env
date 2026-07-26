import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export function findRepoRoot(from: string = process.cwd()): string | null {
  let dir = resolve(from)
  for (;;) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

/** Of the given repo-relative paths, which are tracked by git (i.e. committed in plaintext). */
export function trackedFiles(root: string, paths: string[]): string[] {
  if (paths.length === 0) return []
  const out = git(root, ['ls-files', '--', ...paths])
  return out ? out.split('\n').filter(Boolean) : []
}

/** True if .gitignore rules would prevent the vault from being committed. */
export function isIgnored(root: string, path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', path], { cwd: root, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
