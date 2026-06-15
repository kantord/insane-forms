/** Shared identifiers for the custom build-time code panel. Imported by both the
 * preview (emits highlighted HTML over the channel) and the manager (renders it).
 * The manager is bundled separately from the preview, so the pre-rendered HTML
 * crosses that boundary as a channel message, not a shared import. */

export const ADDON_ID = 'insane/code-panel'
export const PANEL_ID = `${ADDON_ID}/panel`

/** Preview → manager: the highlighted HTML for the story that just rendered.
 * The default-open panel mounts before the first story renders, and the preview
 * re-emits on every render, so no mount-time handshake is needed. */
export const CODE_PANEL_EVENT = `${ADDON_ID}/code`

export type CodePanelPayload = { html: string | null }
