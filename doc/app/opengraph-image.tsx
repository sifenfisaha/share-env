import { OG_SIZE, renderOgImage } from '@/lib/og-image'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'share-env: your .env files, encrypted in git'

export default function Image() {
  return renderOgImage()
}
