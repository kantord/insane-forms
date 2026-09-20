import React from 'react'

export function Checkbox({ checked = false, onChange, style, ...rest }) {
  return (
    <span
      onClick={() => onChange && onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      style={{
        width: '16px',
        height: '16px',
        flexShrink: 0,
        display: 'inline-block',
        boxSizing: 'border-box',
        border: 'var(--rule-w) solid var(--input)',
        background: checked ? 'var(--primary)' : 'var(--background)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        ...style,
      }}
      {...rest}
    />
  )
}
