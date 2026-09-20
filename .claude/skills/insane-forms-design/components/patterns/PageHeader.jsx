import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function PageHeader({ breadcrumb, title, lead, size = 'docs', style }) {
  const fs = size === 'example' ? 'var(--text-title-sm)' : 'var(--text-title)'
  return (
    <div
      style={{
        padding: '56px var(--gutter) 44px',
        borderBottom: 'var(--rule-w) solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        ...style,
      }}
    >
      {breadcrumb ? <Eyebrow>{breadcrumb}</Eyebrow> : null}
      <h1
        style={{
          margin: 0,
          fontWeight: 'var(--weight-display)',
          fontSize: fs,
          lineHeight: 'var(--text-title-lh)',
          letterSpacing: 'var(--text-title-ls)',
        }}
      >
        {title}
      </h1>
      {lead ? (
        <p
          style={{
            margin: 0,
            fontSize: '20px',
            lineHeight: 1.55,
            color: 'var(--body)',
            maxWidth: 'var(--measure)',
            textWrap: 'pretty',
          }}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}
