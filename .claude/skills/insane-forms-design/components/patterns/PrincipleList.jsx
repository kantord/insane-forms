import React from 'react'

export function PrincipleList({ items = [], layout = 'grid', style }) {
  if (layout === 'numbered') {
    return (
      <div
        style={{
          padding: 'var(--section-y) var(--gutter)',
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        {items.map((it, i) => (
          <div
            key={it.title}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 236px 1fr',
              gap: '28px',
              alignItems: 'baseline',
              padding: '26px 0',
              borderTop: i ? 'var(--rule-w) solid var(--border)' : 'none',
            }}
          >
            <span
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}
            >
              {'0' + (i + 1)}
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 'var(--weight-strong)',
                letterSpacing: '-.02em',
              }}
            >
              {it.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-small)',
                lineHeight: 1.7,
                color: 'var(--muted-foreground)',
              }}
            >
              {it.body}
            </p>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div
      style={{
        padding: '48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '44px 48px',
        ...style,
      }}
    >
      {items.map((it) => (
        <div key={it.title}>
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: 'var(--text-h3)',
              fontWeight: 'var(--weight-strong)',
              letterSpacing: '-.02em',
            }}
          >
            {it.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-small)',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
            }}
          >
            {it.body}
          </p>
        </div>
      ))}
    </div>
  )
}
