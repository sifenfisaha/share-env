import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { decrypt, encrypt, type EncryptedEnvelope } from './crypto.js'

export const VAULT_FILENAME = '.envault'

/** What lives inside the encrypted blob: repo-relative path -> file contents. */
export interface VaultPayload {
  files: Record<string, string>
}

export function vaultPath(repoRoot: string): string {
  return join(repoRoot, VAULT_FILENAME)
}

export function vaultExists(repoRoot: string): boolean {
  return existsSync(vaultPath(repoRoot))
}

export function writeVault(repoRoot: string, payload: VaultPayload, passphrase: string): void {
  const envelope = encrypt(Buffer.from(JSON.stringify(payload), 'utf8'), passphrase)
  writeFileSync(vaultPath(repoRoot), JSON.stringify(envelope, null, 2) + '\n', 'utf8')
}

export function readEnvelope(repoRoot: string): EncryptedEnvelope {
  const raw = readFileSync(vaultPath(repoRoot), 'utf8')
  let envelope: EncryptedEnvelope
  try {
    envelope = JSON.parse(raw)
  } catch {
    throw new Error(`${VAULT_FILENAME} is not valid JSON — was it corrupted in a merge?`)
  }
  if (envelope.version !== 1 || envelope.cipher !== 'aes-256-gcm') {
    throw new Error(
      `${VAULT_FILENAME} has an unsupported format (version ${envelope.version}). Update share-env.`
    )
  }
  return envelope
}

export function openVault(repoRoot: string, passphrase: string): VaultPayload {
  const plaintext = decrypt(readEnvelope(repoRoot), passphrase)
  return JSON.parse(plaintext.toString('utf8'))
}
