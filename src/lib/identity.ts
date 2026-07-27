import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

// Raw 32-byte X25519 keys wrapped in the fixed DER prefixes Node expects.
const SPKI_PREFIX = Buffer.from('302a300506032b656e032100', 'hex')
const PKCS8_PREFIX = Buffer.from('302e020100300506032b656e04220420', 'hex')

const PUBLIC_PREFIX = 'sepk_'
const SECRET_PREFIX = 'sesk_'

export function identityPath(): string {
  const configDir = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  return join(configDir, 'share-env', 'identity')
}

export function encodePublicKey(raw: Buffer): string {
  return PUBLIC_PREFIX + raw.toString('base64url')
}

export function decodePublicKey(encoded: string): Buffer {
  if (!encoded.startsWith(PUBLIC_PREFIX)) {
    throw new Error(`Not a share-env public key (expected it to start with "${PUBLIC_PREFIX}").`)
  }
  const raw = Buffer.from(encoded.slice(PUBLIC_PREFIX.length), 'base64url')
  if (raw.length !== 32) throw new Error('Malformed public key.')
  return raw
}

export function isValidPublicKey(encoded: string): boolean {
  try {
    decodePublicKey(encoded)
    return true
  } catch {
    return false
  }
}

function decodeSecretKey(encoded: string): Buffer {
  if (!encoded.startsWith(SECRET_PREFIX)) {
    throw new Error(`Not a share-env secret key (expected it to start with "${SECRET_PREFIX}").`)
  }
  const raw = Buffer.from(encoded.trim().slice(SECRET_PREFIX.length), 'base64url')
  if (raw.length !== 32) throw new Error('Malformed secret key.')
  return raw
}

export function publicKeyObject(raw: Buffer): KeyObject {
  return createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, raw]),
    format: 'der',
    type: 'spki',
  })
}

export function privateKeyObject(raw: Buffer): KeyObject {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, raw]),
    format: 'der',
    type: 'pkcs8',
  })
}

export function secretKeyObject(encoded: string): KeyObject {
  return privateKeyObject(decodeSecretKey(encoded))
}

export function generateIdentity(): { secretKey: string; publicKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('x25519')
  const pubRaw = Buffer.from(publicKey.export({ type: 'spki', format: 'der' }).subarray(-32))
  const privRaw = Buffer.from(privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32))
  return {
    secretKey: SECRET_PREFIX + privRaw.toString('base64url'),
    publicKey: encodePublicKey(pubRaw),
  }
}

export function publicKeyFromSecret(secretKey: string): string {
  const priv = secretKeyObject(secretKey)
  const pubRaw = Buffer.from(createPublicKey(priv).export({ type: 'spki', format: 'der' }).subarray(-32))
  return encodePublicKey(pubRaw)
}

export function saveIdentity(secretKey: string): string {
  const path = identityPath()
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  writeFileSync(path, secretKey + '\n', { encoding: 'utf8', mode: 0o600 })
  chmodSync(path, 0o600)
  return path
}

export function identityExists(): boolean {
  return existsSync(identityPath())
}

/**
 * The secret key for this machine: SHARE_ENV_IDENTITY env var (CI) or the
 * identity file. Returns null if neither exists.
 */
export function resolveSecretKey(): string | null {
  const fromEnv = process.env.SHARE_ENV_IDENTITY
  if (fromEnv) return fromEnv.trim()
  if (!identityExists()) return null
  return readFileSync(identityPath(), 'utf8').trim()
}
