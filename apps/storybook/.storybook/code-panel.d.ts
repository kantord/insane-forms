declare module 'virtual:insane-code-panel' {
  /** file basename (e.g. "forms.stories.tsx") → story display name → HTML. */
  const map: Record<string, Record<string, string>>
  export default map
}
