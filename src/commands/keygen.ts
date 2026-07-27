import { execFileSync } from 'node:child_process'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { findRepoRoot } from '../lib/git.js'
import {
  generateIdentity,
  identityExists,
  identityPath,
  publicKeyFromSecret,
  resolveSecretKey,
  saveIdentity,
} from '../lib/identity.js'
import { addRecipient, ENVKEYS_FILENAME, readRecipients } from '../lib/recipients.js'
import { trustKeys } from '../lib/trust.js'

export function defaultName(): string {
  try {
    const name = execFileSync('git', ['config', 'user.name'], { encoding: 'utf8' }).trim()
    if (name) return name.toLowerCase().replace(/\s+/g, '-')
  } catch {
    // fall through
  }
  return process.env.USER || 'me'
}

export async function keygenCommand(opts: { force?: boolean; name?: string }): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  if (identityExists() && !opts.force) {
    const publicKey = publicKeyFromSecret(resolveSecretKey()!)
    p.log.info(
      `This machine already has an identity (${pc.dim(identityPath())}).\n` +
        `Public key: ${pc.cyan(publicKey)}`
    )
    p.outro(
      `Share that public key with your team, or re-run with ${pc.cyan('--force')} to replace the identity.\n` +
        `   ${pc.yellow('Careful:')} replacing it means you can no longer decrypt vaults pushed to the old key.`
    )
    return
  }

  const identity = generateIdentity()
  const path = saveIdentity(identity.secretKey)
  p.log.success(`Identity created and saved to ${pc.dim(path)} ${pc.dim('(never commit or share this file)')}`)
  p.log.info(`Your public key ${pc.dim('(safe to share anywhere)')}:\n${pc.cyan(identity.publicKey)}`)

  // Offer to add ourselves to the team roster if we're inside a repo.
  const root = findRepoRoot()
  if (root) {
    let name = opts.name
    if (!name && process.stdout.isTTY) {
      const add = await p.confirm({
        message: `Add yourself to ${ENVKEYS_FILENAME} in this repo so pushes include you?`,
        initialValue: true,
      })
      if (!p.isCancel(add) && add) {
        const answer = await p.text({
          message: 'Your name in the roster',
          initialValue: defaultName(),
          validate: (v) => (v && v.trim() && !v.includes(':') ? undefined : 'Name cannot be empty or contain ":"'),
        })
        if (!p.isCancel(answer)) name = answer.trim()
      }
    }
    if (name) {
      const already = readRecipients(root).some((r) => r.publicKey === identity.publicKey)
      if (!already) {
        addRecipient(root, name, identity.publicKey)
        trustKeys(root, [identity.publicKey])
        p.log.success(`Added ${pc.cyan(name)} to ${ENVKEYS_FILENAME} — commit it along with your next push.`)
      }
    }
  }

  p.outro(
    `Next: a teammate with vault access runs ${pc.cyan('share-env keys add <name> <your-public-key>')} and ${pc.cyan('share-env push')}.`
  )
}
