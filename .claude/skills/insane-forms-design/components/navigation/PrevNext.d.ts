/** Article foot: muted back link, accent forward link. */
export interface PrevNextLink {
  href: string
  label: string
}
export interface PrevNextProps {
  prev?: PrevNextLink
  next?: PrevNextLink
  style?: React.CSSProperties
}
export function PrevNext(props: PrevNextProps): JSX.Element
