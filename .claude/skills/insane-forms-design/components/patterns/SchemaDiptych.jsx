import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function SchemaDiptych({
  code,
  rendered,
  leftLabel = 'Schema',
  rightLabel = 'Output',
  style,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: 'var(--rule-w) solid var(--border)',
        ...style,
      }}
    >
      <div
        style={{
          padding: 'var(--section-y) var(--gutter)',
          borderRight: 'var(--rule-w) solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <Eyebrow tone="accent">{leftLabel}</Eyebrow>
        {code}
      </div>
      <div
        style={{
          padding: 'var(--section-y) var(--gutter)',
          background: 'var(--muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <Eyebrow tone="accent">{rightLabel}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>{rendered}</div>
      </div>
    </div>
  )
}
