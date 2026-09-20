/** The separator. Draws at --rule-w, so 2px in light and 1px in dark. */
export interface RuleProps {
  orientation?: 'horizontal' | 'vertical'
  style?: React.CSSProperties
}
export function Rule(props: RuleProps): JSX.Element
