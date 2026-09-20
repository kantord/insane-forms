/** Mono heading over a run of NavItems; nested groups indent behind a left rule. */
export interface NavGroupProps {
  title?: string
  nested?: boolean
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function NavGroup(props: NavGroupProps): JSX.Element
