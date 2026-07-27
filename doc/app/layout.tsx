import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const DESCRIPTION =
  'Securely share .env files with your team through git. Encrypted, no server, no shared passphrase.'

export const metadata: Metadata = {
  metadataBase: new URL('https://share-env.seefun.dev'),
  title: {
    default: 'share-env: your .env files, encrypted in git',
    template: '%s · share-env docs',
  },
  description: DESCRIPTION,
  openGraph: {
    title: 'share-env: your .env files, encrypted in git',
    description: DESCRIPTION,
    url: 'https://share-env.seefun.dev',
    siteName: 'share-env',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'share-env: your .env files, encrypted in git',
    description: DESCRIPTION,
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-neutral-950 text-white antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
