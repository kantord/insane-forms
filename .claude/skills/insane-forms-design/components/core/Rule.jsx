import React from 'react'

export function Rule({ orientation = 'horizontal', style }) {
  const base =
    orientation === 'vertical'
      ? { width: 0, alignSelf: 'stretch', borderLeft: 'var(--rule-w) solid var(--border)' }
      : { height: 0, width: '100%', borderTop: 'var(--rule-w) solid var(--border)' }
  return <div role="separator" style={{ ...base, ...style }} />
}
