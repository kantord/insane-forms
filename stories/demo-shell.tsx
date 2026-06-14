import {
  Bell,
  CalendarDays,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * DemoShell — a fake "client portal for a large catering company" (Tablespread)
 * that frames a form so it reads as living inside a real product. PURE chrome:
 * no logic beyond presentation, no inputs of its own (so it can't collide with a
 * story's accessibility queries). Applied as a Storybook decorator via the
 * `demo` parameter, so it NEVER appears in the code panel — the panel still
 * shows only the story's render body.
 *
 * Submission feedback (the sonner toast of parsed values) is handled by the
 * story's own `onSubmit={demoSubmit}` plus the global <Toaster/> — not here.
 */
export type DemoConfig = {
  /** Sidebar section this screen belongs to (also the active nav item). */
  section: (typeof NAV)[number]['label']
  /** Page title shown above the form. */
  title: string
  /** One-line page description. */
  description?: string
}

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Menus', icon: UtensilsCrossed },
  { label: 'Packages', icon: Package },
  { label: 'Schedule', icon: CalendarDays },
  { label: 'Customers', icon: Users },
  { label: 'Locations', icon: MapPin },
  { label: 'Settings', icon: Settings },
] as const

export function DemoShell({
  section,
  title,
  description,
  children,
}: DemoConfig & { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border bg-background font-sans text-foreground shadow-sm">
      <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-muted/40">
        {/* h-14 matches the topbar, so this divider lines up with its bottom border. */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
          <span className="flex size-8 items-center justify-center rounded-md bg-amber-600 text-white">
            <ChefHat className="size-[1.1rem]" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Tablespread</div>
            <div className="text-[0.7rem] text-muted-foreground">Catering portal</div>
          </div>
        </div>
        <Separator />
        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-auto p-2">
          {NAV.map(({ label, icon: Icon }) => {
            const active = label === section
            return (
              <button
                key={label}
                type="button"
                tabIndex={-1}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-amber-600')} />
                {label}
              </button>
            )
          })}
        </nav>
        <Separator />
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            AR
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium">Avery Reyes</div>
            <div className="text-[0.7rem] text-muted-foreground">Northwind Events</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{section}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium">{title}</span>
          </div>
          <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
        </header>
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl">
            <div className="mb-6">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                {section}
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
