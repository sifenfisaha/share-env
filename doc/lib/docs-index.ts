import {
  BookOpen,
  Download,
  Rocket,
  Users,
  Terminal,
  ShieldCheck,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface DocPage {
  slug: string
  title: string
  description: string
  keywords: string
  icon: LucideIcon
}

export const docs: DocPage[] = [
  {
    slug: 'what-is-share-env',
    title: 'What is share-env?',
    description: 'Here for the first time? Learn what share-env does and why git is the transport.',
    keywords: 'intro overview about envault why',
    icon: BookOpen,
  },
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Install the CLI globally with npm, or build it from source.',
    keywords: 'install npm global setup node',
    icon: Download,
  },
  {
    slug: 'getting-started',
    title: 'Getting started',
    description: 'Create your key, push your first vault, and pull it on another machine.',
    keywords: 'quickstart keygen push pull first vault tutorial',
    icon: Rocket,
  },
  {
    slug: 'team-setup',
    title: 'Team setup',
    description: 'A full walkthrough for onboarding a whole team, key by key.',
    keywords: 'team roster envkeys onboarding offboarding add remove members',
    icon: Users,
  },
  {
    slug: 'commands',
    title: 'Commands',
    description: 'Every command and flag: push, pull, status, keygen, and keys.',
    keywords: 'cli reference push pull status keygen keys flags options aliases',
    icon: Terminal,
  },
  {
    slug: 'security',
    title: 'Security model',
    description: 'Envelope encryption, X25519 keys, and what the threat model covers.',
    keywords: 'crypto encryption aes gcm x25519 hkdf scrypt threat model audit',
    icon: ShieldCheck,
  },
  {
    slug: 'ci',
    title: 'CI & automation',
    description: 'Give CI its own revocable identity and pull env files in pipelines.',
    keywords: 'ci cd github actions automation SHARE_ENV_IDENTITY yes non-interactive',
    icon: Workflow,
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common errors, what they mean, and how to fix them fast.',
    keywords: 'errors not a recipient no identity conflicts backup fix help',
    icon: Wrench,
  },
]

export const faqs: { q: string; a: string }[] = [
  {
    q: 'Is .envault really safe to commit to a public repo?',
    a: 'Yes. The vault is encrypted with AES-256-GCM using a fresh random 256-bit data key on every push, and that key is wrapped separately for each teammate via X25519. The file reveals only recipient names and public keys, which are public by design. There is no passphrase to brute-force.',
  },
  {
    q: 'What if a stranger adds themselves to .envkeys?',
    a: 'By itself, nothing happens. Secrets only reach a key when a teammate who already has them runs push, and push checks the roster against a local trust store kept inside .git (unreachable by pull requests). Any key that was not approved on your machine triggers an explicit confirmation before anything is encrypted to it.',
  },
  {
    q: 'What happens when someone leaves the team?',
    a: 'Run share-env keys remove <name>, rotate the actual secrets they had access to, then push. From that push on their key opens nothing. Rotation matters because old vaults in git history remain readable to their old key.',
  },
  {
    q: 'I lost my private key. Am I locked out forever?',
    a: 'No. Run share-env keygen --force to create a fresh identity, send the new public key to a teammate, and have them re-add you and push. Your old key opens nothing new, which is exactly the point.',
  },
  {
    q: 'Do my teammates need to remember a passphrase?',
    a: 'No. Since v0.2 every teammate has their own keypair, like SSH. pull finds your key automatically and just works. A legacy shared-passphrase mode still exists via push --passphrase for solo projects.',
  },
  {
    q: 'Does it work in CI?',
    a: 'Yes. Create an identity for CI, add its public key to the roster, and set the secret key as the SHARE_ENV_IDENTITY environment variable. Then run share-env pull --yes. The CI key is revocable like any teammate.',
  },
]

export const GITHUB_URL = 'https://github.com/sifenfisaha/share-env'
export const NPM_URL = 'https://www.npmjs.com/package/@sifenfisaha/share-env'
