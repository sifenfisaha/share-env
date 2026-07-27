/**
 * The share-env mark: a keyhole in a rounded tile. One shape, reads as
 * "vault" at any size, works in pure black and white.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect width="24" height="24" rx="6.5" fill="#fff" />
      <circle cx="12" cy="9.75" r="3.1" fill="#000" />
      <path
        d="M10.9 11.9 L9.7 16.3 a0.6 0.6 0 0 0 0.58 0.75 h3.44 a0.6 0.6 0 0 0 0.58 -0.75 L13.1 11.9 Z"
        fill="#000"
      />
    </svg>
  )
}
