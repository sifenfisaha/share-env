import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { diffEnv, parseEnv } from '../lib/env.js'
import { findRepoRoot } from '../lib/git.js'
import { openVaultInteractive } from '../lib/open.js'
import { findEnvFiles } from '../lib/scan.js'
import { readEnvelope, VAULT_FILENAME, vaultExists } from '../lib/vault.js'

export async function statusCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  const root = findRepoRoot()
  if (!root) {
    p.cancel('Not inside a git repository.')
    process.exit(1)
  }
  if (!vaultExists(root)) {
    p.cancel(`No ${VAULT_FILENAME} in this repo yet — run ${pc.cyan('share-env push')} to create one.`)
    process.exit(1)
  }

  const envelope = readEnvelope(root)
  const mode =
    envelope.version === 2
      ? `encrypted to ${envelope.recipients.length} recipient key(s)`
      : 'passphrase-encrypted (legacy)'
  p.log.info(`Vault last updated ${pc.cyan(new Date(envelope.createdAt).toLocaleString())} · ${mode}`)

  const payload = await openVaultInteractive(root)

  const vaultFiles = new Set(Object.keys(payload.files))
  const localFiles = new Set(findEnvFiles(root))

  for (const file of [...new Set([...vaultFiles, ...localFiles])].sort()) {
    if (!localFiles.has(file)) {
      p.log.message(`${pc.yellow('◌')} ${file} ${pc.dim('in vault, missing locally')}`)
    } else if (!vaultFiles.has(file)) {
      p.log.message(`${pc.yellow('+')} ${file} ${pc.dim('local only, not shared yet')}`)
    } else {
      const local = readFileSync(join(root, file), 'utf8')
      if (local === payload.files[file]) {
        p.log.message(`${pc.green('✓')} ${file} ${pc.dim('in sync')}`)
      } else {
        const d = diffEnv(parseEnv(local), parseEnv(payload.files[file]))
        const n = d.added.length + d.localOnly.length + d.changed.length
        p.log.message(`${pc.red('✗')} ${file} ${pc.dim(`differs (${n} variable${n === 1 ? '' : 's'})`)}`)
      }
    }
  }

  p.outro(
    `${pc.cyan('share-env push')} to update the vault · ${pc.cyan('share-env pull')} to apply it`
  )
}
