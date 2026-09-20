import React from 'react'

export function Input({ style, ...rest }) {
  return (
    <input
      style={{
        height: 'var(--field-h)',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0 12px',
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: 'var(--rule-w) solid var(--input)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        outlineColor: 'var(--ring)',
        outlineOffset: '2px',
      }}
      {...rest}
    />
  )
}
