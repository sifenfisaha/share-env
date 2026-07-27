import * as p from '@clack/prompts'
import pc from 'picocolors'
import { NotARecipientError, WrongPassphraseError } from './crypto.js'
import { publicKeyFromSecret, resolveSecretKey } from './identity.js'
import { askPassphrase } from './passphrase.js'
import { openVaultV1, openVaultV2, readEnvelope, type VaultPayload } from './vault.js'

/**
 * Decrypt the vault, handling both formats: v2 uses this machine's identity
 * (no prompt), v1 falls back to the passphrase prompt. Exits with a helpful
 * message on failure.
 */
export async function openVaultInteractive(root: string): Promise<VaultPayload> {
  const envelope = readEnvelope(root)

  if (envelope.version === 2) {
    const secretKey = resolveSecretKey()
    if (!secretKey) {
      p.cancel(
        `This vault is encrypted to team member keys, but this machine has no identity yet.\n` +
          `   Run ${pc.cyan('share-env keygen')}, send the public key to a teammate,\n` +
          `   and have them run ${pc.cyan('share-env keys add <your-name> <your-key>')} and ${pc.cyan('share-env push')}.`
      )
      process.exit(1)
    }
    try {
      const payload = openVaultV2(envelope, secretKey)
      p.log.success(`Vault decrypted with your key ${pc.dim(shorten(publicKeyFromSecret(secretKey)))}`)
      return payload
    } catch (err) {
      if (err instanceof NotARecipientError) {
        p.cancel(
          `Your key ${pc.dim(shorten(publicKeyFromSecret(secretKey)))} is not a recipient of this vault.\n` +
            `   Ask a teammate to run ${pc.cyan('share-env keys add')} with your public key, then ${pc.cyan('share-env push')}.\n` +
            `   Your public key: ${pc.cyan(publicKeyFromSecret(secretKey))}`
        )
        process.exit(1)
      }
      if (err instanceof WrongPassphraseError) {
        p.cancel('Could not decrypt the vault — it may be corrupted or tampered with.')
        process.exit(1)
      }
      throw err
    }
  }

  // v1: legacy passphrase vault
  for (let attempt = 1; attempt <= 3; attempt++) {
    const passphrase = await askPassphrase('Enter the vault passphrase')
    const s = p.spinner()
    s.start('Decrypting vault')
    try {
      const payload = openVaultV1(envelope, passphrase)
      s.stop('Vault decrypted')
      return payload
    } catch (err) {
      if (err instanceof WrongPassphraseError) {
        s.stop(pc.red('Wrong passphrase'), 1)
        if (process.env.SHARE_ENV_KEY || attempt === 3) break
      } else {
        s.stop(pc.red('Failed'), 1)
        throw err
      }
    }
  }
  p.cancel('Could not decrypt the vault.')
  process.exit(1)
}

export function shorten(publicKey: string): string {
  return publicKey.slice(0, 14) + '…'
}
