# Contributing to share-env

Thanks for your interest in contributing! This project is small on purpose, so contributing is simple.

## Development setup

```bash
git clone https://github.com/sifenfisaha/share-env.git
cd share-env
npm install
npm run dev -- --help    # run the CLI from source (tsx)
```

Useful scripts:

- `npm run dev -- <command>` runs the CLI from TypeScript source
- `npm run typecheck` checks types without emitting
- `npm run build` bundles to `dist/` with tsup

To try your build as the real command, run `npm link` once, then `share-env` anywhere. Unlink later with `npm uninstall -g share-env`.

## Testing your changes

Create a throwaway git repo with a few `.env` files and run the full round trip:

```bash
mkdir /tmp/demo && cd /tmp/demo && git init
echo "API_KEY=123" > .env
share-env push
share-env status
share-env pull
```

For non-interactive runs (useful while iterating): set `SHARE_ENV_KEY=yourpass` and pass `--yes`.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep changes focused: one fix or feature per PR.
3. Make sure `npm run typecheck` and `npm run build` pass.
4. Describe what the change does and why. A short terminal recording or paste of the new output helps a lot for UI changes.

## Reporting bugs and ideas

Open an issue at https://github.com/sifenfisaha/share-env/issues with steps to reproduce. For anything security related, see [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Project layout

```
src/
  index.ts           command definitions (commander)
  commands/          push, pull, status
  lib/
    crypto.ts        scrypt + AES-256-GCM (Node built-ins only)
    vault.ts         .envault file format
    scan.ts          finding .env files in the repo
    env.ts           parsing, diffing, merging env files
    git.ts           repo root, tracked files, ignore checks
    ui.ts            diff rendering helpers
    passphrase.ts    prompts
```

One rule that matters: the crypto stays on Node built-ins. Please don't add third-party cryptography dependencies.
