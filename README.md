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

Each person installs it once, globally:

```bash
npm install -g @sifenfisaha/share-env
```

This gives you the `share-env` command.

<details>
<summary>Or install from source</summary>

```bash
git clone https://github.com/sifenfisaha/share-env.git
cd share-env
npm install
npm run build
npm link
```

</details>

Verify it works:

```bash
share-env --help
```

> Both you and your teammate need to do this once. After that, you use `share-env` from inside any of your projects.

## Usage

### Step 1 — Share your envs (person who has the secrets)

Go to the project you work on together (any git repo) and run:

```bash
cd ~/work/my-app
share-env share
```

It scans the whole repo for env files (`.env`, `.env.local`, `.env.production`, …), skipping `node_modules` and friends, and ignoring committable templates like `.env.example`. It shows you what it found, asks for a passphrase (twice), and writes one encrypted `.envault` file at the repo root.

It also warns you if any of your env files are tracked by git in plaintext.

### Step 2 — Commit and push the vault

```bash
git add .envault
git commit -m "share envs"
git push
```

The `.envault` file is the only thing that touches git — your actual `.env` files stay ignored and local.

### Step 3 — Send the passphrase to your teammate

Share it **out-of-band**: a password manager, Signal, or in person. Never commit it or paste it in the repo.

### Step 4 — Receive the envs (teammate)

```bash
git pull
share-env receive
```

They enter the same passphrase, and every env file lands in its original location:

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

Any overwrite or merge saves your previous file as `<file>.bak` first — nothing is ever lost.

### Ongoing use

- Someone changed a secret? They run `share-env share` again (same passphrase), commit the new `.envault`, and push. Everyone else pulls and runs `share-env receive`.
- `share-env status` shows each env file as ✓ in sync, ✗ differs, local-only, or missing locally.
- Everyone on the team uses the same passphrase; to rotate secrets, run `share` with a new passphrase and share it out-of-band again.

## CI / scripting

Set `SHARE_ENV_KEY` to skip the passphrase prompt, and `--yes` to skip confirmations (on conflicts, incoming wins and locals are backed up as `.bak`):

```bash
SHARE_ENV_KEY="$ENV_PASSPHRASE" share-env receive --yes
```

## Notes

- `.env*` should stay in your `.gitignore`; make sure `.envault` is *not* ignored (add `!.envault` if needed). The tool warns about both cases.
- Aliases: `share-env push` / `share-env pull` work too.
