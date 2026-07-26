import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  'target',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.venv',
  'venv',
  '__pycache__',
])

// Files like .env.example are meant to be committed in plaintext — never vault them.
const EXCLUDED_SUFFIXES = /\.(example|sample|template|dist|bak)$/i

export function isEnvFile(name: string): boolean {
  if (name === '.env') return true
  return name.startsWith('.env.') && !EXCLUDED_SUFFIXES.test(name)
}

/** Find every env file under root, returned as sorted repo-relative paths (posix separators). */
export function findEnvFiles(root: string): string[] {
  const results: string[] = []
  const walk = (dir: string) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name))
      } else if (entry.isFile() && isEnvFile(entry.name)) {
        results.push(relative(root, join(dir, entry.name)).split('\\').join('/'))
      }
    }
  }
  walk(root)
  return results.sort()
}
