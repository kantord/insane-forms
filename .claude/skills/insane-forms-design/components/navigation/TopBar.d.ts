/** Right-aligned external links. No wordmark — the rail owns it. */
export interface TopBarLink {
  href: string
  label: string
}
export interface TopBarProps {
  links?: TopBarLink[]
  style?: React.CSSProperties
}
export function TopBar(props: TopBarProps): JSX.Element
