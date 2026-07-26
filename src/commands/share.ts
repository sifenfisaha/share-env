import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { parseEnv } from '../lib/env.js'
import { findRepoRoot, isIgnored, trackedFiles } from '../lib/git.js'
import { askNewPassphrase } from '../lib/passphrase.js'
import { findEnvFiles } from '../lib/scan.js'
import { VAULT_FILENAME, writeVault } from '../lib/vault.js'
import { plural } from '../lib/ui.js'

export async function shareCommand(opts: { yes?: boolean }): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  const root = findRepoRoot()
  if (!root) {
    p.cancel('Not inside a git repository. Run this from your project.')
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

  if (!opts.yes) {
    const ok = await p.confirm({ message: `Encrypt these into ${VAULT_FILENAME}?` })
    if (p.isCancel(ok) || !ok) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
  }

  const passphrase = await askNewPassphrase()

  const s2 = p.spinner()
  s2.start('Deriving key and encrypting (scrypt + AES-256-GCM)')
  writeVault(root, { files: contents }, passphrase)
  s2.stop(`Wrote ${pc.cyan(VAULT_FILENAME)}`)

  if (isIgnored(root, VAULT_FILENAME)) {
    p.log.warn(
      `${VAULT_FILENAME} is currently ignored by .gitignore — un-ignore it so it can be committed.`
    )
  }

  p.outro(
    `Now commit and push it:  ${pc.cyan(`git add ${VAULT_FILENAME} && git commit -m "update envs"`)}\n` +
      `   Your teammate runs ${pc.cyan('share-env receive')} after pulling.`
  )
}
