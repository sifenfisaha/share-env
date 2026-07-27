import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { findRepoRoot } from '../lib/git.js'
import {
  generateIdentity,
  identityPath,
  publicKeyFromSecret,
  resolveSecretKey,
  saveIdentity,
} from '../lib/identity.js'
import { addRecipient, ENVKEYS_FILENAME, readRecipients } from '../lib/recipients.js'
import { findEnvFiles } from '../lib/scan.js'
import { trustKeys } from '../lib/trust.js'
import { defaultName } from './keygen.js'
import { plural } from '../lib/ui.js'
import { VAULT_FILENAME } from '../lib/vault.js'

/** Make sure real env files stay ignored while the vault and roster are committable. */
function ensureGitignore(root: string): string[] {
  const path = join(root, '.gitignore')
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : null
  const lines = (existing ?? '').split('\n').map((l) => l.trim())
  const changes: string[] = []

  const ignoresEnv = lines.some((l) => l === '.env*' || l === '.env' || l === '*.env')
  const toAppend: string[] = []
  if (!ignoresEnv) {
    toAppend.push('.env*')
    changes.push('ignore .env* (keep real secrets out of git)')
  }
  if (!lines.includes(`!${VAULT_FILENAME}`)) {
    toAppend.push(`!${VAULT_FILENAME}`)
    changes.push(`allow ${VAULT_FILENAME} to be committed`)
  }
  if (!lines.includes(`!${ENVKEYS_FILENAME}`)) {
    toAppend.push(`!${ENVKEYS_FILENAME}`)
    changes.push(`allow ${ENVKEYS_FILENAME} to be committed`)
  }
  if (toAppend.length > 0) {
    let content = existing ?? ''
    if (content.length > 0 && !content.endsWith('\n')) content += '\n'
    content += `\n# share-env\n${toAppend.join('\n')}\n`
    writeFileSync(path, content, 'utf8')
    if (existing === null) changes.unshift('created .gitignore')
  }
  return changes
}

export async function initCommand(opts: { name?: string; yes?: boolean }): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  const root = findRepoRoot()
  if (!root) {
    p.cancel(`Not inside a git repository. Run ${pc.cyan('git init')} first, then try again.`)
    process.exit(1)
  }

  // 1. identity: create one if this machine has none
  let secretKey = resolveSecretKey()
  if (!secretKey) {
    const identity = generateIdentity()
    saveIdentity(identity.secretKey)
    secretKey = identity.secretKey
    p.log.success(
      `Created your identity at ${pc.dim(identityPath())} ${pc.dim('(never commit or share this file)')}`
    )
  } else {
    p.log.info('Using the identity already on this machine.')
  }
  const publicKey = publicKeyFromSecret(secretKey)
  p.log.info(`Your public key ${pc.dim('(safe to share anywhere)')}:\n${pc.cyan(publicKey)}`)

  // 2. roster: add yourself if missing
  if (readRecipients(root).some((r) => r.publicKey === publicKey)) {
    p.log.info(`You are already in ${ENVKEYS_FILENAME}.`)
  } else {
    let name = opts.name
    if (!name && !opts.yes && process.stdout.isTTY) {
      const answer = await p.text({
        message: `Your name in ${ENVKEYS_FILENAME}`,
        initialValue: defaultName(),
        validate: (v) =>
          v && v.trim() && !v.includes(':') ? undefined : 'Name cannot be empty or contain ":"',
      })
      if (p.isCancel(answer)) {
        p.cancel('Cancelled.')
        process.exit(0)
      }
      name = answer.trim()
    }
    name ||= defaultName()
    addRecipient(root, name, publicKey)
    trustKeys(root, [publicKey])
    p.log.success(`Added ${pc.cyan(name)} to ${ENVKEYS_FILENAME}`)
  }

  // 3. .gitignore hygiene
  const changes = ensureGitignore(root)
  if (changes.length > 0) {
    p.log.success(`.gitignore updated:\n${changes.map((c) => `  ${c}`).join('\n')}`)
  } else {
    p.log.info('.gitignore already set up correctly.')
  }

  // 4. show what a push would pick up
  const files = findEnvFiles(root)
  if (files.length > 0) {
    p.log.info(
      `Found ${plural(files.length, 'env file')} ready to share:\n` +
        files.map((f) => `  ${pc.cyan(f)}`).join('\n')
    )
  } else {
    p.log.warn('No .env files found yet — create them, then push.')
  }

  p.outro(
    `Ready. Next:  ${pc.cyan('share-env push')}\n` +
      `   then:      ${pc.cyan(`git add ${VAULT_FILENAME} ${ENVKEYS_FILENAME} .gitignore && git commit -m "set up share-env"`)}\n` +
      `   Teammates run ${pc.cyan('share-env keygen')} and send you their key.`
  )
}
