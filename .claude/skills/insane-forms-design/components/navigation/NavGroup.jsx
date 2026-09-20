import React from 'react'
import { Eyebrow } from '../core/Eyebrow.jsx'

export function NavGroup({ title, nested = false, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {title ? (
        <Eyebrow style={{ padding: '0 10px', margin: '26px 0 8px' }}>{title}</Eyebrow>
      ) : null}
      <div
        style={
          nested
            ? {
                paddingLeft: '10px',
                marginLeft: '10px',
                borderLeft: 'var(--rule-w) solid var(--rail-border)',
                display: 'flex',
                flexDirection: 'column',
              }
            : { display: 'flex', flexDirection: 'column' }
        }
      >
        {children}
      </div>
    </div>
  )
}
