import * as p from '@clack/prompts'

/**
 * Env var escape hatch for CI / scripting; interactive prompt otherwise.
 * Exits cleanly if the user cancels (ctrl-c).
 */
export async function askPassphrase(message: string): Promise<string> {
  const fromEnv = process.env.SHARE_ENV_KEY
  if (fromEnv) return fromEnv

  const answer = await p.password({
    message,
    validate: (v) => (v && v.length > 0 ? undefined : 'Passphrase cannot be empty'),
  })
  if (p.isCancel(answer)) {
    p.cancel('Cancelled.')
    process.exit(0)
  }
  return answer
}

export async function askNewPassphrase(): Promise<string> {
  const fromEnv = process.env.SHARE_ENV_KEY
  if (fromEnv) return fromEnv

  for (;;) {
    const first = await p.password({
      message: 'Choose an encryption passphrase (share it with your team out-of-band)',
      validate: (v) => {
        if (!v || v.length < 8) return 'Use at least 8 characters — longer is better'
        return undefined
      },
    })
    if (p.isCancel(first)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    const second = await p.password({ message: 'Type it again to confirm' })
    if (p.isCancel(second)) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
    if (first === second) {
      if (first.length < 16) {
        p.log.warn('That passphrase is on the short side — 16+ characters is recommended.')
      }
      return first
    }
    p.log.error("Passphrases don't match, try again.")
  }
}
