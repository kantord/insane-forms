/**
 * One source line inside a CodeBlock. Lines are block elements, never newline
 * characters — that keeps every line box at --code-line-h and survives whitespace
 * normalisation in templating pipelines.
 */
export interface CodeLineProps {
  /** leading spaces */
  indent?: number
  /** renders an empty line at full line height */
  blank?: boolean
  children?: React.ReactNode
}
export function CodeLine(props: CodeLineProps): JSX.Element
