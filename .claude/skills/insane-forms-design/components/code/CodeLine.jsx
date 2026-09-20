import React from 'react'

export function CodeLine({ indent = 0, blank = false, children }) {
  if (blank) return <span style={{ display: 'block', height: 'var(--code-line-h)' }} />
  return (
    <span style={{ display: 'block' }}>
      {indent > 0 ? <span style={{ color: 'transparent' }}>{'\u00a0'.repeat(indent)}</span> : null}
      {children}
    </span>
  )
}
