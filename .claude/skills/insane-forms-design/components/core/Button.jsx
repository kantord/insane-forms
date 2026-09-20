import React from 'react'

export function Button({ variant = 'primary', type = 'button', children, style, ...rest }) {
  const base = {
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    fontWeight: 'var(--weight-strong)',
    padding: 'var(--control-pad)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    lineHeight: 1.2,
    alignSelf: 'flex-start',
  }
  const variants = {
    primary: { background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none' },
    outline: {
      background: 'transparent',
      color: 'var(--foreground)',
      border: 'var(--rule-w) solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--muted-foreground)',
      border: 'none',
      padding: '6px 8px',
    },
  }
  return (
    <button type={type} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  )
}
