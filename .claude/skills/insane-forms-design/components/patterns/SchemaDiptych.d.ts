/**
 * The core demonstration: schema listing left, the form it renders right, split by a rule.
 * @startingPoint section="Marketing" subtitle="Schema beside the form it renders" viewport="1174x420"
 */
export interface SchemaDiptychProps {
  /** a <CodeBlock> */
  code?: React.ReactNode
  /** Fields, CheckFields, RepeatCards */
  rendered?: React.ReactNode
  leftLabel?: string
  rightLabel?: string
  style?: React.CSSProperties
}
export function SchemaDiptych(props: SchemaDiptychProps): JSX.Element
