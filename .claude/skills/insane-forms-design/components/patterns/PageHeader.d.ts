/**
 * Docs / example page masthead: mono breadcrumb, title, lead.
 * @startingPoint section="Content" subtitle="Docs page header" viewport="1174x260"
 */
export interface PageHeaderProps {
  breadcrumb?: string
  title?: React.ReactNode
  lead?: React.ReactNode
  /** docs = 66px, example = 58px */
  size?: 'docs' | 'example'
  style?: React.CSSProperties
}
export function PageHeader(props: PageHeaderProps): JSX.Element
