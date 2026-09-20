/**
 * The system's only filled control. One per view.
 * @startingPoint section="Controls" subtitle="Primary, outline and ghost buttons" viewport="700x150"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = accent fill; outline = rule only; ghost = bare text */
  variant?: 'primary' | 'outline' | 'ghost'
  children?: React.ReactNode
}
export function Button(props: ButtonProps): JSX.Element
