# share-env

Securely share `.env` files with your team **through git** — encrypted with a passphrase, no server, no hosting, nothing to sign up for.

```
you                                     teammate
───                                     ────────
share-env share                         git pull
  ↳ finds every .env in the repo        share-env receive
  ↳ encrypts them into .envault           ↳ enters the same passphrase
git add .envault && git push              ↳ every .env lands where it belongs
```

The `.envault` file is safe to commit — even to a public repo. It's encrypted with **scrypt** (memory-hard key derivation) + **AES-256-GCM** (authenticated encryption), using only Node's built-in `crypto`. A wrong passphrase or a tampered file fails loudly instead of producing garbage.

## Install

```bash
npm install
npm run build
npm link        # makes the `share-env` command available globally
```

## Usage

Run from anywhere inside a git repo.

### `share-env share`
Scans the whole repo for env files (`.env`, `.env.local`, `.env.production`, …), skipping `node_modules` and friends, and ignoring committable templates like `.env.example`. Asks for a passphrase (twice) and writes `.envault` at the repo root. Commit and push it.

It also warns you if any of your env files are tracked by git in plaintext.

### `share-env receive`
Decrypts `.envault` and places each env file in its original location.

- File doesn't exist locally → created.
- File is identical → skipped.
- File differs → **per-variable conflict UI**:

```
◇  .env differs from the vault
│
│  + NEW_KEY        new from vault
│  ~ DATABASE_URL   postgres://…/bobdb → postgres://…/dev
│  - BOB_ONLY       only in your local file
│
◆  How should .env be resolved?
   ● Merge per variable (pick winners key by key)
   ○ Take incoming (overwrite, keep .bak of local)
   ○ Keep local
   ○ View full file diff
```

Any overwrite or merge saves your previous file as `<file>.bak` first.

### `share-env status`
Shows each env file as ✓ in sync, ✗ differs, local-only, or missing locally.

## Sharing the passphrase

Share it **out-of-band** — a password manager, Signal, in person. Never commit it or put it in the repo. Everyone on the team uses the same passphrase; to rotate secrets, run `share` again with a new one.

## CI / scripting

Set `SHARE_ENV_KEY` to skip the passphrase prompt, and `--yes` to skip confirmations (on conflicts, incoming wins and locals are backed up as `.bak`):

```bash
SHARE_ENV_KEY="$ENV_PASSPHRASE" share-env receive --yes
```

## Notes

- `.env*` should stay in your `.gitignore`; make sure `.envault` is *not* ignored (add `!.envault` if needed). The tool warns about both cases.
- Aliases: `share-env push` / `share-env pull` work too.
