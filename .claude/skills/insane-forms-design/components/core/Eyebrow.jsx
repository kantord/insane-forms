import React from 'react'

export function Eyebrow({ tone = 'muted', as: Tag = 'div', children, style, ...rest }) {
  const color = tone === 'accent' ? 'var(--primary)' : 'var(--muted-foreground)'
  return (
    <Tag
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-eyebrow)',
        letterSpacing: 'var(--text-eyebrow-ls)',
        textTransform: 'uppercase',
        lineHeight: 1.4,
        color,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
