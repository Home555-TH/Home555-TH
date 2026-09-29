import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: { icon: 32, text: 12 },
    md: { icon: 48, text: 16 },
    lg: { icon: 64, text: 20 }
  }

  const { icon, text } = sizeMap[size]

  return (
    <div className="flex items-center gap-3">
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* House shape background */}
        <rect x="8" y="32" width="48" height="24" rx="4" fill="#1e40af" />

        {/* Roof */}
        <path d="M8 32L32 12L56 32" fill="#3b82f6" />

        {/* Door */}
        <rect x="28" y="40" width="8" height="16" fill="#fff" opacity="0.3" rx="1" />

        {/* Windows */}
        <rect x="14" y="38" width="6" height="6" fill="#fbbf24" opacity="0.8" />
        <rect x="44" y="38" width="6" height="6" fill="#fbbf24" opacity="0.8" />

        {/* Door handle */}
        <circle cx="37" cy="48" r="1" fill="#1e40af" />

        {/* Accent line */}
        <line x1="8" y1="32" x2="56" y2="32" stroke="#60a5fa" strokeWidth="1" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div style={{ fontSize: `${text}px` }} className="font-bold text-blue-900">
            Wilairat
          </div>
          <div style={{ fontSize: `${text * 0.7}px` }} className="text-blue-600 leading-none">
            ERP
          </div>
        </div>
      )}
    </div>
  )
}
