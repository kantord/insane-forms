import React from 'react'

export function Section({ ruled = 'none', padded = true, children, style, ...rest }) {
  const borders = {
    none: {},
    top: { borderTop: 'var(--rule-w) solid var(--border)' },
    bottom: { borderBottom: 'var(--rule-w) solid var(--border)' },
    both: {
      borderTop: 'var(--rule-w) solid var(--border)',
      borderBottom: 'var(--rule-w) solid var(--border)',
    },
  }
  return (
    <section
      style={{
        padding: padded ? 'var(--section-y) var(--gutter)' : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--stack-2)',
        ...borders[ruled],
        ...style,
      }}
      {...rest}
    >
      {children}
    </section>
  )
}
