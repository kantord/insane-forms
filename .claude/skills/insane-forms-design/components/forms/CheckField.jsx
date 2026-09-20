import React from 'react'
import { Checkbox } from './Checkbox.jsx'

export function CheckField({ label, value = false, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        color: 'var(--foreground)',
        ...style,
      }}
    >
      <Checkbox checked={value} onChange={onChange} />
      <span>{label}</span>
    </div>
  )
}
