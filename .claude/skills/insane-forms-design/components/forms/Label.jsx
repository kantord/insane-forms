import React from 'react'

export function Label({ children, style, ...rest }) {
  return (
    <label
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--foreground)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </label>
  )
}
