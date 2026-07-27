import * as p from '@clack/prompts'
import pc from 'picocolors'
import { findRepoRoot } from '../lib/git.js'
import { isValidPublicKey, publicKeyFromSecret, resolveSecretKey } from '../lib/identity.js'
import { shorten } from '../lib/open.js'
import { addRecipient, ENVKEYS_FILENAME, readRecipients, removeRecipient } from '../lib/recipients.js'
import { trustKeys, untrustKeys } from '../lib/trust.js'

function requireRoot(): string {
  const root = findRepoRoot()
  if (!root) {
    p.cancel('Not inside a git repository.')
    process.exit(1)
  }
  return root
}

export async function keysListCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))
  const root = requireRoot()
  const recipients = readRecipients(root)
  if (recipients.length === 0) {
    p.outro(
      `No recipients yet. Run ${pc.cyan('share-env keygen')} to create your key, then ${pc.cyan('share-env keys add <name> <pubkey>')} for teammates.`
    )
    return
  }
  const secretKey = resolveSecretKey()
  const myKey = secretKey ? publicKeyFromSecret(secretKey) : null
  for (const r of recipients) {
    const you = r.publicKey === myKey ? pc.green(' (you)') : ''
    p.log.message(`${pc.cyan(r.name)}${you}  ${pc.dim(shorten(r.publicKey))}`)
  }
  p.outro(`${recipients.length} recipient key(s) in ${ENVKEYS_FILENAME} — these can decrypt the next push.`)
}

export async function keysAddCommand(name: string, publicKey: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))
  const root = requireRoot()
  if (name.includes(':')) {
    p.cancel('Names cannot contain ":".')
    process.exit(1)
  }
  if (!isValidPublicKey(publicKey)) {
    p.cancel(`That does not look like a share-env public key (they start with ${pc.cyan('sepk_')}).`)
    process.exit(1)
  }
  if (readRecipients(root).some((r) => r.publicKey === publicKey)) {
    p.outro('That key is already in the roster.')
    return
  }
  addRecipient(root, name, publicKey)
  trustKeys(root, [publicKey]) // added by hand on this machine = approved
  p.log.success(`Added ${pc.cyan(name)} to ${ENVKEYS_FILENAME}`)
  p.outro(
    `Now run ${pc.cyan('share-env push')} and commit ${ENVKEYS_FILENAME} + .envault so ${name} can pull.`
  )
}

export async function keysRemoveCommand(name: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))
  const root = requireRoot()
  const removed = removeRecipient(root, name)
  if (removed.length === 0) {
    p.cancel(`No recipient named "${name}" in ${ENVKEYS_FILENAME}.`)
    process.exit(1)
  }
  untrustKeys(root, removed.map((r) => r.publicKey)) // re-adding them later must be confirmed again
  p.log.success(`Removed ${pc.cyan(name)} (${removed.length} key${removed.length === 1 ? '' : 's'})`)
  p.outro(
    `Now: 1) rotate the actual secrets they had access to, 2) run ${pc.cyan('share-env push')} and commit.\n` +
      `   ${pc.dim('Old vaults in git history remain readable to them — rotation is what revokes the past.')}`
  )
}
