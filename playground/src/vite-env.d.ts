/// <reference types="vite/client" />

declare module 'virtual:snippets' {
  const snippets: Record<'bureau' | 'terminal' | 'meadow', string>
  export default snippets
  export const morphSteps: import('@shikijs/magic-move/core').KeyedTokensInfo[]
}
