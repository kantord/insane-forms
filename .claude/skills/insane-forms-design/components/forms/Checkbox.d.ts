/** 16px square. Accent fill when checked, no glyph. */
export interface CheckboxProps {
  checked?: boolean
  onChange?: (next: boolean) => void
  style?: React.CSSProperties
}
export function Checkbox(props: CheckboxProps): JSX.Element
