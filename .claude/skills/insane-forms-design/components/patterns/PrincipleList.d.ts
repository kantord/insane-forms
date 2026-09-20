/** Four-up principles, as a two-column grid or a ruled numbered list. */
export interface Principle {
  title: string
  body: React.ReactNode
}
export interface PrincipleListProps {
  items?: Principle[]
  layout?: 'grid' | 'numbered'
  style?: React.CSSProperties
}
export function PrincipleList(props: PrincipleListProps): JSX.Element
