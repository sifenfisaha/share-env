# share-env

Securely share `.env` files with your team **through git**. No server, no signup, no shared passphrase: each teammate has their own key, like SSH.

```
you                                     teammate
───                                     ────────
share-env push                          git pull
  ↳ finds every .env in the repo        share-env pull
  ↳ encrypts them into .envault           ↳ decrypts with their own key
git add .envault && git push              ↳ every .env lands where it belongs
```

The `.envault` file is safe to commit, even to a public repo: envelope encryption (X25519 + AES-256-GCM, the same model as age and SOPS) with a fresh random data key on every push, built only on Node's built-in crypto.

**Full documentation: [share-env.seefun.dev](https://share-env.seefun.dev)**

## Install

```bash
npm install -g @sifenfisaha/share-env
```

## Quick start

```bash
share-env init       # identity + roster + .gitignore rules, in one command
share-env push       # encrypt every .env in the repo into .envault
git add .envault .envkeys .gitignore && git commit -m "share envs" && git push
```

Your teammate:

```bash
share-env keygen     # they send you their public key
# you: share-env keys add <name> <key> && share-env push && git push
git pull
share-env pull       # every .env lands where it belongs, no passphrase
```

Conflicts are resolved per variable in the terminal, and overwrites always keep a `.bak`.

## Learn more

- [Getting started](https://share-env.seefun.dev/docs/getting-started)
- [Team setup walkthrough](https://share-env.seefun.dev/docs/team-setup)
- [Command reference](https://share-env.seefun.dev/docs/commands)
- [Security model](https://share-env.seefun.dev/docs/security)
- [CI & automation](https://share-env.seefun.dev/docs/ci)
- [Troubleshooting](https://share-env.seefun.dev/docs/troubleshooting)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

[MIT](LICENSE)
