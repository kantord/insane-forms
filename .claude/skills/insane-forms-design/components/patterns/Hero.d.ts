/**
 * Two-line display headline — first line flush left with the accent verb, second flush right —
 * over a 2fr/1fr row of lead paragraph and install command.
 * @startingPoint section="Marketing" subtitle="Split display hero" viewport="1174x420"
 */
export interface HeroProps {
  lineOne?: string
  /** the accent word, rendered inline at the end of line one */
  verb?: string
  lineTwo?: string
  lead?: React.ReactNode
  /** an <InstallCommand> */
  install?: React.ReactNode
  meta?: React.ReactNode
  style?: React.CSSProperties
}
export function Hero(props: HeroProps): JSX.Element
