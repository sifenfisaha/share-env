/**
 * Monochrome cover art: flowing ribbon curves on black, echoing the
 * reference banner but strictly black & white. Pure SVG so it stays
 * crisp at any size and costs nothing to load.
 */
export function HeroArt() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <rect width="1200" height="420" fill="#000" />
      <g opacity="0.5" filter="url(#blur-soft)">
        <path
          d="M-100 360 C 200 80, 420 460, 700 200 S 1150 40, 1350 180"
          stroke="url(#fade)"
          strokeWidth="90"
        />
      </g>
      <g opacity="0.35" filter="url(#blur-hard)">
        <path
          d="M-80 140 C 240 340, 520 -40, 820 220 S 1180 380, 1320 240"
          stroke="url(#fade)"
          strokeWidth="60"
        />
      </g>
      <g opacity="0.9">
        <path
          d="M-60 320 C 260 120, 460 400, 760 180 S 1140 80, 1300 200"
          stroke="url(#fade)"
          strokeWidth="1.5"
        />
        <path
          d="M-60 300 C 280 100, 480 390, 780 170 S 1150 70, 1310 190"
          stroke="url(#fade)"
          strokeWidth="1"
          opacity="0.7"
        />
        <path
          d="M-60 340 C 240 140, 440 410, 740 190 S 1130 90, 1290 210"
          stroke="url(#fade)"
          strokeWidth="1"
          opacity="0.5"
        />
        <path
          d="M-60 160 C 220 320, 540 20, 840 240 S 1160 340, 1320 260"
          stroke="url(#fade)"
          strokeWidth="1"
          opacity="0.4"
        />
        <path
          d="M-60 180 C 240 340, 560 40, 860 250 S 1170 350, 1330 270"
          stroke="url(#fade)"
          strokeWidth="0.75"
          opacity="0.3"
        />
      </g>
      <rect width="1200" height="420" fill="url(#vignette)" />
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1200" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.85" />
        </radialGradient>
        <filter id="blur-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
        <filter id="blur-hard" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
      </defs>
    </svg>
  )
}
