import React from 'react'

export function StatementBand({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--foreground)',
        color: 'var(--background)',
        padding: 'var(--section-y) var(--gutter)',
        ...style,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '28px',
          lineHeight: 1.35,
          fontWeight: 600,
          letterSpacing: '-.02em',
          maxWidth: '900px',
          textWrap: 'pretty',
        }}
      >
        {children}
      </p>
    </div>
  )
}
