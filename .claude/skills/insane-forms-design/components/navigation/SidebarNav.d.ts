/**
 * The permanent left rail: wordmark, nav groups, pinned rev/licence foot.
 * Identical on every page — it is what makes landing and docs feel continuous.
 * @startingPoint section="Shell" subtitle="Permanent docs rail" viewport="700x420"
 */
export interface SidebarNavProps {
  wordmark?: string
  rev?: string
  licence?: string
  /** NavGroup / NavItem children */
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function SidebarNav(props: SidebarNavProps): JSX.Element
