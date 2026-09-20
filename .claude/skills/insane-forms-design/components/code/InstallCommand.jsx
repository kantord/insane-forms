import React from 'react'

export function InstallCommand({ children = 'pnpm add insane-forms', style }) {
  return (
    <code
      style={{
        alignSelf: 'flex-start',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        background: 'var(--foreground)',
        color: 'var(--background)',
        padding: '13px 16px',
        ...style,
      }}
    >
      {children}
    </code>
  )
}
