import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function CodeBlock({ label, boxed = false, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...style }}>
      {label ? <Eyebrow tone="accent">{label}</Eyebrow> : null}
      <pre
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-code)',
          lineHeight: 'var(--text-code-lh)',
          color: 'var(--code-n1)',
          background: boxed ? 'var(--code-bg)' : 'transparent',
          border: boxed ? 'var(--rule-w) solid var(--border)' : 'none',
          padding: boxed ? '28px 32px' : 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </pre>
    </div>
  )
}
