export const Receipt = ({ data }: { data: unknown }) => (
  <div className="receipt mt-6 border border-ink bg-paper-deep" role="status">
    <div className="flex items-center gap-3 border-b border-dashed border-dim px-3 py-2">
      <span className="size-2 rounded-full bg-pop" aria-hidden="true" />
      <span className="text-[0.68rem] uppercase tracking-[0.12em] text-dim">
        z.output — parsed &amp; typed
      </span>
    </div>
    <pre className="m-0 overflow-x-auto p-3.5 text-[0.74rem] leading-normal">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
)
