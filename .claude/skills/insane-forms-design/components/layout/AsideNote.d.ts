/** Marginal note: accent eyebrow over 14px prose. No box, no background. */
export interface AsideNoteProps {
  label?: string
  /** top offset in px, used to align the note with the section it annotates */
  offset?: number
  children?: React.ReactNode
  style?: React.CSSProperties
}
export function AsideNote(props: AsideNoteProps): JSX.Element
