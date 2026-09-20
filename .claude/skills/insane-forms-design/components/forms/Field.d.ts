/**
 * Label over Input — what a schema node's renderer returns.
 * @startingPoint section="Forms" subtitle="Field, CheckField and a repeated group" viewport="700x300"
 */
export interface FieldProps {
  label?: string
  value?: string
  onChange?: (next: string) => void
  id?: string
  style?: React.CSSProperties
}
export function Field(props: FieldProps): JSX.Element
