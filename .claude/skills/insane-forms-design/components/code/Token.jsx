import React from 'react'

const STEPS = {
  n1: 'var(--code-n1)',
  n2: 'var(--code-n2)',
  n3: 'var(--code-n3)',
  a1: 'var(--code-a1)',
  a2: 'var(--code-a2)',
}

export function Token({ step = 'n1', children }) {
  return <span style={{ color: STEPS[step] || STEPS.n1 }}>{children}</span>
}
