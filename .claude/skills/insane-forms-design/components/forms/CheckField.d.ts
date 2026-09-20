/** Checkbox + label in a row. */
export interface CheckFieldProps {
  label?: string
  value?: boolean
  onChange?: (next: boolean) => void
  style?: React.CSSProperties
}
export function CheckField(props: CheckFieldProps): JSX.Element
