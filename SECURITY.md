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

- Key derivation: scrypt with N=2^17, r=8, p=1, 16-byte random salt per vault
- Encryption: AES-256-GCM with a 12-byte random IV per vault, auth tag verified on decrypt
- Only Node.js built-in crypto is used; there are no third-party cryptography dependencies
- The `.envault` envelope stores kdf parameters, salt, IV, tag, and ciphertext; all file paths and contents live inside the encrypted payload
