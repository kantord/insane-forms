/** One item of an array node: mono index, remove affordance, its fields. */
export interface RepeatCardProps {
  index?: number
  onRemove?: () => void
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function RepeatCard(props: RepeatCardProps): JSX.Element
