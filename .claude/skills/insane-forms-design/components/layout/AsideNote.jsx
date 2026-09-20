import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function AsideNote({ label = 'Note', offset = 0, children, style }) {
  return (
    <div
      style={{
        marginTop: offset ? offset + 'px' : '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        ...style,
      }}
    >
      <Eyebrow tone="accent">{label}</Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-aside)',
          lineHeight: 1.65,
          color: 'var(--body)',
          textWrap: 'pretty',
        }}
      >
        {children}
      </p>
    </div>
  )
}
