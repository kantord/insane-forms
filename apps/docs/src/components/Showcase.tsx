import Link from '@docusaurus/Link'
import type { ReactNode } from 'react'
import { CodePane } from './CodePane'

type BiomeName = 'bureau' | 'terminal' | 'meadow'

export const Showcase = ({
  id,
  biome,
  title,
  blurb,
  story,
  children,
}: {
  id: string
  biome: BiomeName
  title: string
  blurb: ReactNode
  story: string
  children: ReactNode
}) => (
  <section id={id} className={`biome-${biome} w-full bg-paper py-16 text-ink`}>
    <div className="mx-auto flex max-w-[1180px] flex-col px-6">
      <h2 className="mb-1.5 font-serif text-3xl font-normal">{title}</h2>
      <p className="m-0 mb-6 max-w-2xl text-[0.9rem] text-dim">{blurb}</p>
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:h-[78svh] lg:grid-cols-2">
        <div className="min-h-0 border border-ink">
          <CodePane id={biome} />
        </div>
        <div className="demo-pane min-h-0 overflow-auto border border-ink bg-paper p-7">
          {children}
        </div>
      </div>
      <Link
        href={`pathname://./storybook/?path=/story/${story}`}
        className="mt-2 self-end text-[0.65rem] uppercase tracking-[0.14em] text-dim/80 hover:text-pop"
      >
        this example in storybook ↗
      </Link>
    </div>
  </section>
)
