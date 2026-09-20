import React from 'react'

export function AddControl({ label = '+ add item', count, max, onAdd, style }) {
  return (
    <div
      onClick={onAdd}
      style={{
        border: 'var(--rule-w) dashed var(--rail-border)',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--primary)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {count != null && max != null ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            whiteSpace: 'nowrap',
          }}
        >
          {count + ' of ' + max}
        </span>
      ) : null}
    </div>
  )
}
