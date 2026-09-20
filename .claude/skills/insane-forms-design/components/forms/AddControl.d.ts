/** Dashed row that adds an array item; shows the bounds read from the schema. */
export interface AddControlProps {
  label?: string
  /** current item count */
  count?: number
  /** upper bound, from the array's own .max() */
  max?: number
  onAdd?: () => void
  style?: React.CSSProperties
}
export function AddControl(props: AddControlProps): JSX.Element
