import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function RepeatCard({ index = 1, onRemove, children, style }) {
  return (
    <div
      style={{
        border: 'var(--rule-w) solid var(--border)',
        background: 'var(--background)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Eyebrow style={{ whiteSpace: 'nowrap' }}>{'Item ' + index}</Eyebrow>
        <span
          onClick={onRemove}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
          }}
        >
          remove
        </span>
      </div>
      {children}
    </div>
  )
}
