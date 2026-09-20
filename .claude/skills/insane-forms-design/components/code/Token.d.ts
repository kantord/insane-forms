/**
 * One highlighted run inside a CodeLine. Duotone: three neutral steps, two accent steps.
 * n1 identifiers · n2 keys/attrs/strings · n3 keywords/punctuation · a1 constructors & constraints · a2 numeric args
 */
export interface TokenProps {
  step?: 'n1' | 'n2' | 'n3' | 'a1' | 'a2'
  children?: React.ReactNode
}
export function Token(props: TokenProps): JSX.Element
