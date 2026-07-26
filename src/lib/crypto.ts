import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

// scrypt parameters: N=2^17 is memory-hard (~128 MB) so brute-forcing the
// passphrase from a leaked .envault is expensive even on GPUs.
const SCRYPT_N = 2 ** 17
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAXMEM = 256 * 1024 * 1024
const KEY_LEN = 32
const SALT_LEN = 16
const IV_LEN = 12

export class WrongPassphraseError extends Error {
  constructor() {
    super('Wrong passphrase (or the vault file was tampered with).')
    this.name = 'WrongPassphraseError'
  }
}

export interface EncryptedEnvelope {
  version: 1
  cipher: 'aes-256-gcm'
  kdf: { name: 'scrypt'; N: number; r: number; p: number }
  salt: string
  iv: string
  tag: string
  data: string
  createdAt: string
}

function deriveKey(passphrase: string, salt: Buffer, N: number, r: number, p: number): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN, { N, r, p, maxmem: SCRYPT_MAXMEM })
}

export function encrypt(plaintext: Buffer, passphrase: string): EncryptedEnvelope {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = deriveKey(passphrase, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return {
    version: 1,
    cipher: 'aes-256-gcm',
    kdf: { name: 'scrypt', N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
    createdAt: new Date().toISOString(),
  }
}

export function decrypt(envelope: EncryptedEnvelope, passphrase: string): Buffer {
  const salt = Buffer.from(envelope.salt, 'base64')
  const iv = Buffer.from(envelope.iv, 'base64')
  const key = deriveKey(passphrase, salt, envelope.kdf.N, envelope.kdf.r, envelope.kdf.p)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
  try {
    return Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()])
  } catch {
    // GCM authentication failure: wrong key or modified ciphertext.
    throw new WrongPassphraseError()
  }
}

export function contentsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
