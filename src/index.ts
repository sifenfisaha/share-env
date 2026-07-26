#!/usr/bin/env node
import { Command } from 'commander'
import { receiveCommand } from './commands/receive.js'
import { shareCommand } from './commands/share.js'
import { statusCommand } from './commands/status.js'

const program = new Command()

program
  .name('share-env')
  .description('Securely share .env files with your team through git — encrypted, no server needed.')
  .version('0.1.0')

program
  .command('share')
  .alias('push')
  .description('Scan the repo for .env files and encrypt them into .envault')
  .option('-y, --yes', 'skip confirmation prompts')
  .action(shareCommand)

program
  .command('receive')
  .alias('pull')
  .description('Decrypt .envault and place env files where they belong')
  .option('-y, --yes', 'non-interactive: incoming wins, local files backed up as .bak')
  .action(receiveCommand)

program
  .command('status')
  .description('Compare local env files against the vault')
  .action(statusCommand)

program.parseAsync().catch((err: Error) => {
  console.error(`\n✖ ${err.message}`)
  process.exit(1)
})
