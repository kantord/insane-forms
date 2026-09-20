/** Mono uppercase label — the system's "machine voice". */
export interface EyebrowProps {
  /** accent for a section label, muted for breadcrumbs and meta */
  tone?: 'muted' | 'accent'
  as?: keyof JSX.IntrinsicElements
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function Eyebrow(props: EyebrowProps): JSX.Element
