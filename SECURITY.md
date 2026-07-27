# Security Policy

share-env exists to keep secrets safe, so security reports get top priority.

## Reporting a vulnerability

Please do not open a public issue for security problems. Instead, use GitHub's private reporting: go to the repo's **Security** tab and click **Report a vulnerability**, or email the maintainer directly.

You can expect an acknowledgement within a few days. Please include steps to reproduce and, if you have one, a suggested fix.

## Scope

Things we consider vulnerabilities:

- Any way to recover plaintext from an `.envault` file without the passphrase
- Weaknesses in the key derivation or encryption (scrypt, AES-256-GCM) as used here
- The CLI writing secrets anywhere unexpected (logs, temp files, git-tracked files)
- Tampering with an `.envault` file going undetected on `pull`

Things that are out of scope:

- Weak passphrases chosen by users
- Compromised machines of vault users
- The security of how teams share the passphrase out-of-band

## Design notes for reviewers

Recipient-key vaults (v2, the default):

- Envelope encryption: each push generates a fresh random 256-bit data key that encrypts the payload with AES-256-GCM (12-byte random IV, tag verified on decrypt)
- The data key is wrapped per recipient: fresh ephemeral X25519 keypair per recipient per push, ECDH against the recipient's public key, HKDF-SHA256 (salt = ephemeral pub || recipient pub, info = "share-env/v2/wrap") derives the AES-256-GCM wrapping key
- Private identity keys live at `~/.config/share-env/identity` with mode 600 and are never written to the repo
- The envelope reveals only recipient names and public keys; all file paths and contents live inside the encrypted payload
- Known accepted property: vaults in git history remain decryptable by keys that were recipients at the time; offboarding therefore requires rotating the underlying secrets, as documented in the README

Passphrase vaults (v1, legacy `--passphrase` mode):

- Key derivation: scrypt with N=2^17, r=8, p=1, 16-byte random salt per vault
- Encryption: AES-256-GCM with a 12-byte random IV per vault, auth tag verified on decrypt

Both modes use only Node.js built-in crypto; there are no third-party cryptography dependencies.
