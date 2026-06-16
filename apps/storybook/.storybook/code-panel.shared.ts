/** Shared identifiers for the custom build-time code panel. Imported by both the
 * preview (emits highlighted HTML over the channel) and the manager (renders it).
 * The manager is bundled separately from the preview, so the pre-rendered HTML
 * crosses that boundary as a channel message, not a shared import. */

export const ADDON_ID = 'insane/code-panel'
export const PANEL_ID = `${ADDON_ID}/panel`

/** Preview → manager: the highlighted HTML for the story that just rendered. */
export const CODE_PANEL_EVENT = `${ADDON_ID}/code`
/** Manager → preview: the panel just mounted (e.g. user expanded a collapsed
 * panel, or a narrow viewport mounted it late) — re-send the current code. */
export const CODE_PANEL_REQUEST = `${ADDON_ID}/request`

export type CodePanelPayload = { html: string | null }
