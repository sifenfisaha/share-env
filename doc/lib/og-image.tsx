import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

const font = (file: string) => readFileSync(join(process.cwd(), 'assets/fonts', file))

/** The social preview card: same visual language as the site hero. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000',
          padding: '64px 72px',
          fontFamily: 'Geist',
          position: 'relative',
        }}
      >
        {/* ribbon art, same curves as the site hero */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <path
            d="M700 700 C 850 420, 900 260, 1050 140 S 1200 20, 1300 -40"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M760 700 C 910 430, 950 270, 1090 150 S 1230 30, 1330 -30"
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M650 700 C 800 415, 860 250, 1010 130 S 1170 10, 1270 -50"
            stroke="#ffffff"
            strokeOpacity="0.2"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M880 700 C 1010 460, 1030 300, 1150 180 S 1270 60, 1350 0"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* header: logo + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="52" height="52" viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6.5" fill="#fff" />
            <circle cx="12" cy="9.75" r="3.1" fill="#000" />
            <path
              d="M10.9 11.9 L9.7 16.3 a0.6 0.6 0 0 0 0.58 0.75 h3.44 a0.6 0.6 0 0 0 0.58 -0.75 L13.1 11.9 Z"
              fill="#000"
            />
          </svg>
          <span
            style={{
              fontFamily: 'Geist Mono',
              fontSize: 30,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            share-env
          </span>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
            }}
          >
            Your .env files, encrypted in git
          </div>
          <div style={{ fontSize: 30, color: '#a3a3a3', lineHeight: 1.4 }}>
            No server. No shared passphrase. One encrypted vault your team pulls with their own
            key.
          </div>
        </div>

        {/* footer: domain + install */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'Geist Mono',
            fontSize: 24,
            color: '#737373',
          }}
        >
          <span style={{ color: '#e5e5e5' }}>share-env.seefun.dev</span>
          <span>npm i -g @sifenfisaha/share-env</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Geist', data: font('geist-400.woff'), weight: 400 as const, style: 'normal' as const },
        { name: 'Geist', data: font('geist-600.woff'), weight: 600 as const, style: 'normal' as const },
        { name: 'Geist Mono', data: font('geist-mono-400.woff'), weight: 400 as const, style: 'normal' as const },
      ],
    }
  )
}
