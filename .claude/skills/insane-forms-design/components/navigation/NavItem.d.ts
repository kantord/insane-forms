/** Sidebar link. Active = accent fill; hover = muted fill. */
export interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean
  children?: React.ReactNode
}
export function NavItem(props: NavItemProps): JSX.Element
