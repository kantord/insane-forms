import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function SidebarNav({
  wordmark = 'insane-forms',
  rev = 'rev 0.1.0',
  licence = 'mit',
  children,
  style,
}) {
  return (
    <nav
      style={{
        width: 'var(--rail-nav-w)',
        flexShrink: 0,
        boxSizing: 'border-box',
        background: 'var(--rail)',
        borderRight: 'var(--rule-w) solid var(--border)',
        padding: 'var(--rail-pad-y) var(--rail-pad-x)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 800,
          fontSize: '16px',
          letterSpacing: '-.02em',
          padding: '0 8px 20px',
          color: 'var(--foreground)',
        }}
      >
        {wordmark}
      </div>
      {children}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '14px',
          borderTop: 'var(--rule-w) solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Eyebrow style={{ letterSpacing: 0, textTransform: 'none' }}>{rev}</Eyebrow>
        <Eyebrow style={{ letterSpacing: 0, textTransform: 'none' }}>{licence}</Eyebrow>
      </div>
    </nav>
  )
}
