import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { WrongPassphraseError } from '../lib/crypto.js'
import { buildMerged, diffEnv, parseEnv, type EnvDiff } from '../lib/env.js'
import { findRepoRoot } from '../lib/git.js'
import { askPassphrase } from '../lib/passphrase.js'
import { openVault, VAULT_FILENAME, vaultExists, type VaultPayload } from '../lib/vault.js'
import { plural, renderEnvDiff, renderFileDiff, truncate } from '../lib/ui.js'

type FileAction = 'created' | 'updated' | 'merged' | 'kept' | 'unchanged'

export async function receiveCommand(opts: { yes?: boolean }): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' share-env ')))

  const root = findRepoRoot()
  if (!root) {
    p.cancel('Not inside a git repository. Run this from your project.')
    process.exit(1)
  }
  if (!vaultExists(root)) {
    p.cancel(
      `No ${VAULT_FILENAME} found. Pull the latest changes, or ask your teammate to run ${pc.cyan('share-env push')} first.`
    )
    process.exit(1)
  }

  let payload: VaultPayload | null = null
  for (let attempt = 1; attempt <= 3 && !payload; attempt++) {
    const passphrase = await askPassphrase('Enter the passphrase your teammate used')
    const s = p.spinner()
    s.start('Decrypting vault')
    try {
      payload = openVault(root, passphrase)
      s.stop('Vault decrypted')
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        s.stop(pc.red('Wrong passphrase'), 1)
        if (process.env.SHARE_ENV_KEY || attempt === 3) {
          p.cancel('Could not decrypt the vault.')
          process.exit(1)
        }
      } else {
        s.stop(pc.red('Failed'), 1)
        throw err
      }
    }
  }

  const entries = Object.entries(payload!.files)
  p.log.info(`Vault contains ${plural(entries.length, 'env file')}`)

  const summary: Record<FileAction, string[]> = {
    created: [],
    updated: [],
    merged: [],
    kept: [],
    unchanged: [],
  }

  for (const [relPath, incoming] of entries) {
    const absPath = join(root, relPath)
    if (!existsSync(absPath)) {
      mkdirSync(dirname(absPath), { recursive: true })
      writeFileSync(absPath, incoming, 'utf8')
      summary.created.push(relPath)
      p.log.success(`${pc.green('created')} ${relPath}`)
      continue
    }
    const local = readFileSync(absPath, 'utf8')
    if (local === incoming) {
      summary.unchanged.push(relPath)
      p.log.info(`${pc.dim('up to date')} ${pc.dim(relPath)}`)
      continue
    }
    const action = await resolveConflict(absPath, relPath, local, incoming, opts)
    summary[action].push(relPath)
  }

  const done = [
    summary.created.length && pc.green(`${summary.created.length} created`),
    summary.updated.length && pc.green(`${summary.updated.length} overwritten`),
    summary.merged.length && pc.cyan(`${summary.merged.length} merged`),
    summary.kept.length && pc.yellow(`${summary.kept.length} kept local`),
    summary.unchanged.length && pc.dim(`${summary.unchanged.length} already in sync`),
  ]
    .filter(Boolean)
    .join(pc.dim(' · '))
  p.outro(done || 'Nothing to do.')
}

async function resolveConflict(
  absPath: string,
  relPath: string,
  local: string,
  incoming: string,
  opts: { yes?: boolean }
): Promise<FileAction> {
  const diff = diffEnv(parseEnv(local), parseEnv(incoming))
  const changes =
    diff.added.length + diff.localOnly.length + diff.changed.length > 0
      ? renderEnvDiff(diff)
      : pc.dim('Same variables, but formatting/comments differ.')

  p.log.step(`${pc.bold(relPath)} ${pc.yellow('differs from the vault')}`)
  p.log.message(changes)

  if (opts.yes || !process.stdout.isTTY) {
    // Non-interactive: incoming wins, but keep a backup of the local file.
    writeFileSync(absPath + '.bak', local, 'utf8')
    writeFileSync(absPath, incoming, 'utf8')
    p.log.success(`${pc.green('overwrote')} ${relPath} ${pc.dim(`(backup: ${relPath}.bak)`)}`)
    return 'updated'
  }

  for (;;) {
    const choice = await p.select({
      message: `How should ${relPath} be resolved?`,
      options: [
        { value: 'merge', label: 'Merge per variable', hint: 'pick winners key by key' },
        { value: 'incoming', label: 'Take incoming', hint: 'overwrite, keep .bak of local' },
        { value: 'local', label: 'Keep local', hint: 'ignore the vault version' },
        { value: 'diff', label: 'View full file diff' },
      ],
    })
    if (p.isCancel(choice)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    switch (choice) {
      case 'diff':
        p.log.message(renderFileDiff(local, incoming))
        continue
      case 'local':
        p.log.info(`${pc.yellow('kept local')} ${relPath}`)
        return 'kept'
      case 'incoming':
        writeFileSync(absPath + '.bak', local, 'utf8')
        writeFileSync(absPath, incoming, 'utf8')
        p.log.success(`${pc.green('overwrote')} ${relPath} ${pc.dim(`(backup: ${relPath}.bak)`)}`)
        return 'updated'
      case 'merge': {
        const merged = await mergePerVariable(local, incoming, diff)
        writeFileSync(absPath + '.bak', local, 'utf8')
        writeFileSync(absPath, merged, 'utf8')
        p.log.success(`${pc.green('merged')} ${relPath} ${pc.dim(`(backup: ${relPath}.bak)`)}`)
        return 'merged'
      }
    }
  }
}

async function mergePerVariable(local: string, incoming: string, diff: EnvDiff): Promise<string> {
  const localMap = parseEnv(local)
  const useLocal = new Map<string, string>()
  const dropIncoming = new Set<string>()
  const keepLocalOnly: [string, string][] = []

  for (const { key, local: lv, incoming: iv } of diff.changed) {
    const pick = await p.select({
      message: pc.yellow(key),
      options: [
        { value: 'incoming', label: `incoming  ${pc.green(truncate(iv))}` },
        { value: 'local', label: `local     ${pc.red(truncate(lv))}` },
      ],
    })
    if (p.isCancel(pick)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    if (pick === 'local') useLocal.set(key, lv)
  }

  for (const key of diff.added) {
    const add = await p.confirm({
      message: `Add new variable ${pc.green(key)}?`,
      initialValue: true,
    })
    if (p.isCancel(add)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    if (!add) dropIncoming.add(key)
  }

  for (const key of diff.localOnly) {
    const keep = await p.confirm({
      message: `Keep your local-only variable ${pc.red(key)}?`,
      initialValue: true,
    })
    if (p.isCancel(keep)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    if (keep) keepLocalOnly.push([key, localMap.get(key)!])
  }

  return buildMerged(incoming, { useLocal, dropIncoming, keepLocalOnly })
}
