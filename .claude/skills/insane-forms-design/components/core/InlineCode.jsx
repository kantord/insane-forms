import React from 'react'

export function InlineCode({ children, style, ...rest }) {
  return (
    <code
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-code)',
        color: 'inherit',
        ...style,
      }}
      {...rest}
    >
      {children}
    </code>
  )
}
