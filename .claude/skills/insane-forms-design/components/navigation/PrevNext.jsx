import React from 'react'

export function PrevNext({ prev, next, style }) {
  const base = { fontFamily: 'var(--font-mono)', fontSize: '13px', textDecoration: 'none' }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        ...style,
      }}
    >
      <a href={prev ? prev.href : '#'} style={{ ...base, color: 'var(--muted-foreground)' }}>
        {prev ? '← ' + prev.label : ''}
      </a>
      <a
        href={next ? next.href : '#'}
        style={{ ...base, color: 'var(--primary)', fontWeight: 600 }}
      >
        {next ? next.label + ' →' : ''}
      </a>
    </div>
  )
}
