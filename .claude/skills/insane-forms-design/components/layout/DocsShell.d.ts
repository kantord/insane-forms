/**
 * The frame every page shares: fixed nav rail, flexible content column, fixed aside rail.
 * @startingPoint section="Shell" subtitle="Three-column docs frame" viewport="1440x700"
 */
export interface DocsShellProps {
  /** a <SidebarNav> */
  nav?: React.ReactNode
  /** an <AsideRail> */
  aside?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function DocsShell(props: DocsShellProps): JSX.Element
