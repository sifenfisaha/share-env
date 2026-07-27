import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isValidPublicKey } from './identity.js'

export const ENVKEYS_FILENAME = '.envkeys'

export interface Recipient {
  name: string
  publicKey: string
}

function envkeysPath(root: string): string {
  return join(root, ENVKEYS_FILENAME)
}

/**
 * .envkeys format, one recipient per line (a person can have several lines,
 * e.g. laptop and desktop):
 *
 *   # team roster: who can decrypt the next push
 *   alice: sepk_...
 *   bob: sepk_...
 */
export function readRecipients(root: string): Recipient[] {
  if (!existsSync(envkeysPath(root))) return []
  const recipients: Recipient[] = []
  for (const line of readFileSync(envkeysPath(root), 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf(':')
    if (sep === -1) continue
    const name = trimmed.slice(0, sep).trim()
    const publicKey = trimmed.slice(sep + 1).trim()
    if (name && isValidPublicKey(publicKey)) recipients.push({ name, publicKey })
  }
  return recipients
}

export function addRecipient(root: string, name: string, publicKey: string): void {
  const path = envkeysPath(root)
  let content = existsSync(path) ? readFileSync(path, 'utf8') : '# who can decrypt the next share-env push\n'
  if (content.length > 0 && !content.endsWith('\n')) content += '\n'
  content += `${name}: ${publicKey}\n`
  writeFileSync(path, content, 'utf8')
}

/** Remove every key belonging to `name`. Returns how many entries were removed. */
export function removeRecipient(root: string, name: string): number {
  const path = envkeysPath(root)
  if (!existsSync(path)) return 0
  let removed = 0
  const kept = readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return true
      const entryName = trimmed.slice(0, trimmed.indexOf(':')).trim()
      if (entryName === name) {
        removed++
        return false
      }
      return true
    })
  writeFileSync(path, kept.join('\n'), 'utf8')
  return removed
}
