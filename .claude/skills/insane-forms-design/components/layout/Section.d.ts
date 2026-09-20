/** Content band with the system's padding and optional rules. */
export interface SectionProps {
  ruled?: 'none' | 'top' | 'bottom' | 'both'
  padded?: boolean
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function Section(props: SectionProps): JSX.Element
