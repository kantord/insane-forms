import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function AsideRail({ title = 'Asides', children, style }) {
  return (
    <aside
      style={{
        width: 'var(--rail-aside-w)',
        flexShrink: 0,
        boxSizing: 'border-box',
        background: 'var(--rail)',
        borderLeft: 'var(--rule-w) solid var(--border)',
        padding: 'var(--aside-pad-y) var(--aside-pad-x) 48px',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <Eyebrow style={{ paddingBottom: '18px', borderBottom: 'var(--rule-w) solid var(--border)' }}>
        {title}
      </Eyebrow>
      {children}
    </aside>
  )
}
