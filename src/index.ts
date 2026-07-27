#!/usr/bin/env node
import { createRequire } from 'node:module'
import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { keygenCommand } from './commands/keygen.js'
import { keysAddCommand, keysListCommand, keysRemoveCommand } from './commands/keys.js'
import { receiveCommand } from './commands/receive.js'
import { shareCommand } from './commands/share.js'
import { statusCommand } from './commands/status.js'

const { version } = createRequire(import.meta.url)('../package.json')

const program = new Command()

program
  .name('share-env')
  .description('Securely share .env files with your team through git — encrypted, no server needed.')
  .version(version)

program
  .command('init')
  .description('Set up share-env in this repo: identity, roster entry, .gitignore rules')
  .option('-n, --name <name>', 'your name in .envkeys')
  .option('-y, --yes', 'non-interactive: use defaults')
  .action(initCommand)

program
  .command('push')
  .alias('share')
  .description('Encrypt every .env in the repo into .envault for the keys in .envkeys')
  .option('-y, --yes', 'skip confirmation prompts')
  .option('-p, --passphrase', 'use a shared passphrase instead of recipient keys (legacy mode)')
  .action(shareCommand)

program
  .command('pull')
  .alias('receive')
  .description('Decrypt .envault with your key and place env files where they belong')
  .option('-y, --yes', 'non-interactive: incoming wins, local files backed up as .bak')
  .action(receiveCommand)

program
  .command('status')
  .description('Compare local env files against the vault')
  .action(statusCommand)

program
  .command('keygen')
  .description('Create this machine\'s identity keypair (once per machine)')
  .option('-f, --force', 'replace an existing identity')
  .option('-n, --name <name>', 'add yourself to .envkeys under this name')
  .action(keygenCommand)

const keys = program.command('keys').description('Manage who can decrypt the vault (.envkeys)')
keys.command('list', { isDefault: true }).description('List recipients').action(keysListCommand)
keys
  .command('add <name> <publicKey>')
  .description('Add a teammate\'s public key')
  .action(keysAddCommand)
keys
  .command('remove <name>')
  .description('Remove a teammate (then rotate secrets and push)')
  .action(keysRemoveCommand)

program.parseAsync().catch((err: Error) => {
  console.error(`\n✖ ${err.message}`)
  process.exit(1)
})
