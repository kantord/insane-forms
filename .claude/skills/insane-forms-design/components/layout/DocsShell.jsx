import React from 'react'

export function DocsShell({ nav, aside, children, style }) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100%',
        ...style,
      }}
    >
      {nav}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {aside}
    </div>
  )
}
