import {
  createCipheriv,
  createDecipheriv,
  diffieHellman,
  hkdfSync,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import {
  decodePublicKey,
  generateIdentity,
  publicKeyFromSecret,
  publicKeyObject,
  secretKeyObject,
} from './identity.js'

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

export class NotARecipientError extends Error {
  constructor() {
    super('Your key is not among the recipients of this vault.')
    this.name = 'NotARecipientError'
  }
}

export interface WrappedRecipient {
  name: string
  publicKey: string
  /** ephemeral X25519 public key used for this recipient's key exchange */
  ephemeral: string
  iv: string
  tag: string
  wrappedKey: string
}

export interface EncryptedEnvelopeV2 {
  version: 2
  cipher: 'aes-256-gcm'
  recipients: WrappedRecipient[]
  iv: string
  tag: string
  data: string
  createdAt: string
}

const HKDF_INFO = 'share-env/v2/wrap'

function deriveWrapKey(shared: ArrayBuffer | Buffer, ephPub: Buffer, recipientPub: Buffer): Buffer {
  const salt = Buffer.concat([ephPub, recipientPub])
  return Buffer.from(hkdfSync('sha256', Buffer.from(shared as ArrayBuffer), salt, HKDF_INFO, 32))
}

/**
 * Envelope encryption: a fresh random data key encrypts the payload, then the
 * data key is wrapped separately for each recipient via X25519 + HKDF + GCM.
 */
export function encryptForRecipients(
  plaintext: Buffer,
  recipients: { name: string; publicKey: string }[]
): EncryptedEnvelopeV2 {
  const dataKey = randomBytes(32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', dataKey, iv)
  const data = Buffer.concat([cipher.update(plaintext), cipher.final()])

  const wrapped: WrappedRecipient[] = recipients.map(({ name, publicKey }) => {
    const recipientRaw = decodePublicKey(publicKey)
    // Fresh ephemeral keypair per recipient per push: no key reuse anywhere.
    const eph = generateIdentity()
    const ephPubRaw = decodePublicKey(eph.publicKey)
    const shared = diffieHellman({
      privateKey: secretKeyObject(eph.secretKey),
      publicKey: publicKeyObject(recipientRaw),
    })
    const wrapKey = deriveWrapKey(shared, ephPubRaw, recipientRaw)
    const wiv = randomBytes(12)
    const wc = createCipheriv('aes-256-gcm', wrapKey, wiv)
    const wrappedKey = Buffer.concat([wc.update(dataKey), wc.final()])
    return {
      name,
      publicKey,
      ephemeral: ephPubRaw.toString('base64'),
      iv: wiv.toString('base64'),
      tag: wc.getAuthTag().toString('base64'),
      wrappedKey: wrappedKey.toString('base64'),
    }
  })

  dataKey.fill(0)
  return {
    version: 2,
    cipher: 'aes-256-gcm',
    recipients: wrapped,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
    createdAt: new Date().toISOString(),
  }
}

export function decryptWithIdentity(envelope: EncryptedEnvelopeV2, secretKey: string): Buffer {
  const myPublicKey = publicKeyFromSecret(secretKey)
  const myRaw = decodePublicKey(myPublicKey)
  const mine = envelope.recipients.filter((r) => r.publicKey === myPublicKey)
  if (mine.length === 0) throw new NotARecipientError()

  for (const entry of mine) {
    try {
      const ephRaw = Buffer.from(entry.ephemeral, 'base64')
      const shared = diffieHellman({
        privateKey: secretKeyObject(secretKey),
        publicKey: publicKeyObject(ephRaw),
      })
      const wrapKey = deriveWrapKey(shared, ephRaw, myRaw)
      const kd = createDecipheriv('aes-256-gcm', wrapKey, Buffer.from(entry.iv, 'base64'))
      kd.setAuthTag(Buffer.from(entry.tag, 'base64'))
      const dataKey = Buffer.concat([kd.update(Buffer.from(entry.wrappedKey, 'base64')), kd.final()])

      const pd = createDecipheriv('aes-256-gcm', dataKey, Buffer.from(envelope.iv, 'base64'))
      pd.setAuthTag(Buffer.from(envelope.tag, 'base64'))
      return Buffer.concat([pd.update(Buffer.from(envelope.data, 'base64')), pd.final()])
    } catch {
      continue // try the next entry for this key, if any
    }
  }
  throw new WrongPassphraseError()
}

export function contentsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
