import React from 'react'

export function Hero({ lineOne, verb, lineTwo, lead, install, meta, style }) {
  return (
    <div
      style={{
        padding: '64px var(--gutter) 68px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        borderBottom: 'var(--rule-w) solid var(--border)',
        ...style,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontWeight: 'var(--weight-display)',
          fontSize: 'var(--text-display)',
          lineHeight: 'var(--text-display-lh)',
          letterSpacing: 'var(--text-display-ls)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
          {lineOne} {verb ? <span style={{ color: 'var(--primary)' }}>{verb}</span> : null}
        </span>
        <span style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>{lineTwo}</span>
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-lead)',
            lineHeight: 'var(--text-lead-lh)',
            color: 'var(--body)',
            textWrap: 'pretty',
          }}
        >
          {lead}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {install}
          {meta ? (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-meta)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
              }}
            >
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
