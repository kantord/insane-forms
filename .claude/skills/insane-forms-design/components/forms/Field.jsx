import React from 'react'
import { Input } from './Input.jsx'
import { Label } from './Label.jsx'

export function Field({ label, value, onChange, id, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', ...style }}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}
