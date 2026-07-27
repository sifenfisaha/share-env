# share-env

Securely share `.env` files with your team **through git**. No server, no signup, and since v0.2 no shared passphrase either: each teammate has their own key, like SSH.

```
you                                     teammate
───                                     ────────
share-env push                          git pull
  ↳ finds every .env in the repo        share-env pull
  ↳ encrypts them into .envault           ↳ decrypts with their own key
git add .envault && git push              ↳ every .env lands where it belongs
```

The `.envault` file is safe to commit, even to a public repo. Under the hood it uses envelope encryption, the same model as age and SOPS: every push generates a fresh random 256-bit data key that encrypts the payload with AES-256-GCM, and that data key is wrapped separately for each teammate's X25519 public key. There is no passphrase to brute-force and no shared secret to leak. Only Node's built-in crypto is used.

## Install

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

## Usage

### Step 0 — Everyone: create your key (once per machine)

```bash
share-env keygen
```

This creates an identity at `~/.config/share-env/identity` (private, never leaves your machine) and prints your **public key** (`sepk_...`), which is safe to share anywhere: chat, email, a PR. Inside a repo it offers to add you to the team roster right away.

### Step 1 — Share your envs

```bash
cd ~/work/my-app
share-env push
```

It scans the whole repo for env files (`.env`, `.env.local`, `.env.production`, ...), skipping `node_modules` and committable templates like `.env.example`, then encrypts them to every key listed in `.envkeys`. It also warns if any env file is tracked by git in plaintext, or if your own key is missing from the roster.

### Step 2 — Commit and push

```bash
git add .envault .envkeys
git commit -m "share envs"
git push
```

- `.envault` is the encrypted vault.
- `.envkeys` is the plain-text team roster (names + public keys). It doubles as your access list, and git history becomes your audit log of who was added or removed and when.

### Step 3 — Teammate: get added, then pull

The teammate runs `share-env keygen`, sends you their public key (any channel is fine, it's public), and you run:

```bash
share-env keys add bob sepk_theirkey...
share-env push
git add .envault .envkeys && git commit -m "add bob" && git push
```

Then they:

```bash
git pull
share-env pull
```

No passphrase. Their key opens the vault, and every env file lands in its original location:

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

Any overwrite or merge saves your previous file as `<file>.bak` first, so nothing is ever lost.

### Managing the team

```bash
share-env keys                      # list who can decrypt the next push
share-env keys add <name> <pubkey>  # onboard someone
share-env keys remove <name>        # offboard someone
```

When someone leaves: `keys remove` them, **rotate the actual secrets they had access to**, then `push` and commit. Removal protects every future push; rotation is what handles the past, since old vaults in git history remain readable to their old key. (This is true of every tool in this category, including SOPS and git-crypt.)

A person can have multiple keys (laptop + desktop): just `keys add` them under the same name.

Lost key? Run `keygen --force` for a fresh identity, get re-added, done.

### Everyday use

- Someone changed a secret? They run `share-env push`, commit, push. Everyone else pulls and runs `share-env pull`.
- `share-env status` shows each env file as ✓ in sync, ✗ differs, local-only, or missing locally.

## Team setup walkthrough

A concrete example: you plus five teammates (Sara, Dawit, Hana, Yonas, and Lidya) on a repo called `my-app`.

### Phase 1: everyone installs and creates a key (each person, once ever)

All six of you run this on your own machines:

```bash
npm install -g @sifenfisaha/share-env
share-env keygen
```

`keygen` prints a public key like `sepk_b0e5LGEg...`. Each teammate sends theirs to you however they like (the group chat is fine, it is a public key). If you run `keygen` inside the repo, it offers to add you to `.envkeys` right away.

### Phase 2: build the roster and push (just you, once)

```bash
cd ~/work/my-app
share-env keys add sara  sepk_saraskey...
share-env keys add dawit sepk_dawitskey...
share-env keys add hana  sepk_hanaskey...
share-env keys add yonas sepk_yonaskey...
share-env keys add lidya sepk_lidyaskey...

share-env keys       # should list all six names, with "(you)" next to yours

share-env push
git add .envault .envkeys
git commit -m "share envs with the team"
git push
```

### Phase 3: everyone pulls (each teammate, ~10 seconds)

```bash
cd my-app
git pull
share-env pull
```

No passphrase to type. Every `.env` file appears exactly where it belongs, even in subfolders. If Hana already had her own `.env` with different values, she gets the per-variable diff and picks what to keep; her old file is saved as `.env.bak` either way.

### Daily life after setup

- Dawit adds a new API key to `.env`: he runs `share-env push`, commits `.envault`, pushes. Everyone else does `git pull && share-env pull`.
- Anyone unsure if they are current runs `share-env status`.
- Yonas gets a second laptop: he runs `keygen` there, and anyone adds it with `share-env keys add yonas sepk_newkey...` then pushes. The same name twice is fine.

### When someone leaves

Say Lidya leaves the company:

```bash
share-env keys remove lidya
```

Then rotate the real secrets she knew (new database password, new API keys) in your `.env` files, and:

```bash
share-env push
git add .envault .envkeys && git commit -m "offboard lidya" && git push
```

From that push on, her key opens nothing. The rotation step matters because old commits in git history are still readable to her old key; new secrets make that history worthless.

Tip for smooth onboarding: instead of collecting keys in chat, teammates can add themselves to `.envkeys` in a PR (it is a plain text file). You merge the PR, run `share-env push`, and the PR history doubles as your audit log of who got access when.

## Legacy passphrase mode

Prefer a single shared passphrase (e.g. solo projects)? It's still there:

```bash
share-env push --passphrase
```

This encrypts with scrypt (N=2^17, memory-hard) + AES-256-GCM. `pull` auto-detects which kind of vault it's opening, and vaults created by v0.1 keep working.

## CI / scripting

Give CI its own identity: run `share-env keygen` somewhere safe, add that public key to `.envkeys`, and set the secret key as a CI secret:

```bash
SHARE_ENV_IDENTITY="sesk_..." share-env pull --yes
```

`--yes` means non-interactive: on conflicts, incoming wins and locals are backed up as `.bak`. For legacy passphrase vaults, use `SHARE_ENV_KEY` instead. A CI identity is revocable like any other teammate: `keys remove ci`.

## Notes

- Keep `.env*` in your `.gitignore`; make sure `.envault` and `.envkeys` are *not* ignored. The tool warns about both cases.
- Aliases: `share-env share` / `share-env receive` work too.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started. For security issues, please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

[MIT](LICENSE)
