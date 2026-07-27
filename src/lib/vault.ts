import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  decrypt,
  decryptWithIdentity,
  encrypt,
  encryptForRecipients,
  type EncryptedEnvelope,
  type EncryptedEnvelopeV2,
} from './crypto.js'

export const VAULT_FILENAME = '.envault'

export type AnyEnvelope = EncryptedEnvelope | EncryptedEnvelopeV2

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

function writeEnvelope(repoRoot: string, envelope: AnyEnvelope): void {
  writeFileSync(vaultPath(repoRoot), JSON.stringify(envelope, null, 2) + '\n', 'utf8')
}

export function writeVault(repoRoot: string, payload: VaultPayload, passphrase: string): void {
  writeEnvelope(repoRoot, encrypt(Buffer.from(JSON.stringify(payload), 'utf8'), passphrase))
}

export function writeVaultForRecipients(
  repoRoot: string,
  payload: VaultPayload,
  recipients: { name: string; publicKey: string }[]
): void {
  writeEnvelope(
    repoRoot,
    encryptForRecipients(Buffer.from(JSON.stringify(payload), 'utf8'), recipients)
  )
}

export function readEnvelope(repoRoot: string): AnyEnvelope {
  const raw = readFileSync(vaultPath(repoRoot), 'utf8')
  let envelope: AnyEnvelope
  try {
    envelope = JSON.parse(raw)
  } catch {
    throw new Error(`${VAULT_FILENAME} is not valid JSON — was it corrupted in a merge?`)
  }
  if ((envelope.version !== 1 && envelope.version !== 2) || envelope.cipher !== 'aes-256-gcm') {
    throw new Error(
      `${VAULT_FILENAME} has an unsupported format (version ${envelope.version}). Update share-env.`
    )
  }
  return envelope
}

export function openVaultV1(envelope: EncryptedEnvelope, passphrase: string): VaultPayload {
  return JSON.parse(decrypt(envelope, passphrase).toString('utf8'))
}

export function openVaultV2(envelope: EncryptedEnvelopeV2, secretKey: string): VaultPayload {
  return JSON.parse(decryptWithIdentity(envelope, secretKey).toString('utf8'))
}
