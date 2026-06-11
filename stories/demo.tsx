import { toast } from 'sonner'

/** Demo submit handler: toasts the parsed z.output. Examples pass it as one
 * honest line — `onSubmit={demoSubmit}` — instead of inlining toast plumbing.
 * Signature-compatible with any real handler a consumer would write. */
export const demoSubmit = (data: unknown) => {
  toast(<pre>{JSON.stringify(data, null, 2)}</pre>)
}
