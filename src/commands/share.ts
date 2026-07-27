import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { parseEnv } from '../lib/env.js'
import { findRepoRoot, isIgnored, trackedFiles } from '../lib/git.js'
import { publicKeyFromSecret, resolveSecretKey } from '../lib/identity.js'
import { askNewPassphrase } from '../lib/passphrase.js'
import { ENVKEYS_FILENAME, readRecipients } from '../lib/recipients.js'
import { findEnvFiles } from '../lib/scan.js'
import { VAULT_FILENAME, writeVault, writeVaultForRecipients } from '../lib/vault.js'
import { plural } from '../lib/ui.js'

export async function shareCommand(opts: { yes?: boolean; passphrase?: boolean }): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  const root = findRepoRoot()
  if (!root) {
    p.cancel('Not inside a git repository. Run this from your project.')
    process.exit(1)
  }

  // Resolve who we're encrypting to before doing any work.
  const recipients = opts.passphrase ? [] : readRecipients(root)
  if (!opts.passphrase && recipients.length === 0) {
    p.cancel(
      `No recipients found in ${ENVKEYS_FILENAME}.\n` +
        `   Set up key-based sharing:  ${pc.cyan('share-env keygen')} (each teammate), then ${pc.cyan('share-env keys add <name> <pubkey>')}\n` +
        `   Or use a shared passphrase instead:  ${pc.cyan('share-env push --passphrase')}`
    )
    process.exit(1)
  }

  const s = p.spinner()
  s.start('Scanning for env files')
  const files = findEnvFiles(root)
  s.stop(`Found ${plural(files.length, 'env file')}`)

  if (files.length === 0) {
    p.outro('Nothing to share — no .env files found.')
    return
  }

  const contents: Record<string, string> = {}
  for (const file of files) {
    contents[file] = readFileSync(join(root, file), 'utf8')
    const vars = parseEnv(contents[file]).size
    p.log.info(`${pc.cyan(file)} ${pc.dim(`(${plural(vars, 'variable')})`)}`)
  }

  const tracked = trackedFiles(root, files)
  if (tracked.length > 0) {
    p.log.warn(
      `${pc.yellow('These env files are tracked by git and committed in PLAINTEXT:')}\n` +
        tracked.map((f) => `  ${f}`).join('\n') +
        `\nConsider adding them to .gitignore — that's the whole point of share-env.`
    )
  }

  if (!opts.passphrase) {
    p.log.info(
      `Encrypting to ${plural(recipients.length, 'recipient key')}: ${recipients.map((r) => pc.cyan(r.name)).join(', ')}`
    )
    const secretKey = resolveSecretKey()
    if (secretKey && !recipients.some((r) => r.publicKey === publicKeyFromSecret(secretKey))) {
      p.log.warn(
        `Your own key is not in ${ENVKEYS_FILENAME} — you will not be able to pull this vault yourself.\n` +
          `Add yourself:  ${pc.cyan(`share-env keys add <your-name> ${publicKeyFromSecret(secretKey)}`)}`
      )
    }
  }

  if (!opts.yes) {
    const ok = await p.confirm({ message: `Encrypt these into ${VAULT_FILENAME}?` })
    if (p.isCancel(ok) || !ok) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
  }

  if (opts.passphrase) {
    const passphrase = await askNewPassphrase()
    const s2 = p.spinner()
    s2.start('Deriving key and encrypting (scrypt + AES-256-GCM)')
    writeVault(root, { files: contents }, passphrase)
    s2.stop(`Wrote ${pc.cyan(VAULT_FILENAME)}`)
  } else {
    const s2 = p.spinner()
    s2.start('Encrypting (X25519 envelope + AES-256-GCM)')
    writeVaultForRecipients(root, { files: contents }, recipients)
    s2.stop(`Wrote ${pc.cyan(VAULT_FILENAME)} for ${plural(recipients.length, 'recipient key')}`)
  }

  for (const f of [VAULT_FILENAME, ENVKEYS_FILENAME]) {
    if (isIgnored(root, f)) {
      p.log.warn(`${f} is currently ignored by .gitignore — un-ignore it so it can be committed.`)
    }
  }

  const commitFiles = opts.passphrase ? VAULT_FILENAME : `${VAULT_FILENAME} ${ENVKEYS_FILENAME}`
  p.outro(
    `Now commit and push:  ${pc.cyan(`git add ${commitFiles} && git commit -m "update envs"`)}\n` +
      `   Your teammate runs ${pc.cyan('share-env pull')} after pulling.`
  )
}
