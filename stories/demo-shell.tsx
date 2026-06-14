import {
  BarChart3,
  Bell,
  CalendarDays,
  ChefHat,
  ClipboardList,
  House,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  Package,
  PanelsTopLeft,
  Rocket,
  Settings,
  ShoppingBag,
  Tag,
  Terminal,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/**
 * Demo apps — fake products that FRAME a form so it reads as a native feature,
 * not a contrivance. Three layouts (catering sidebar · dev console tabs · store
 * top-bar), each themed by a scoped `.theme-*` class (see examples/demo-themes.css)
 * so the SAME form restyles to match with ZERO example-code changes. Applied as a
 * Storybook decorator via `parameters.demo`, so the chrome never reaches the code
 * panel. PURE presentation: no inputs of their own (can't collide with a story's
 * a11y queries), nav labels avoid every play's button regexes, responsive.
 */
export type AppVariant = 'catering' | 'dev' | 'store'
export type DemoConfig = {
  /** Section this screen sits in (highlights the matching nav item). */
  section: string
  /** Page title shown above the form. */
  title: string
  /** One-line page description. */
  description?: string
}
/** The `parameters.demo` value: an app + page meta, or the thin `none` wrapper. */
export type DemoParam = ({ variant: AppVariant } & DemoConfig) | { variant: 'none' }

type NavItem = { label: string; icon: LucideIcon }
type ShellProps = DemoConfig & { children: ReactNode }

const Identity = ({ org }: { org: string }) => (
  <div className="flex shrink-0 items-center gap-2.5">
    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
      AR
    </span>
    <div className="leading-tight">
      <div className="text-sm font-medium">Avery Reyes</div>
      <div className="text-[0.7rem] text-muted-foreground">{org}</div>
    </div>
  </div>
)

const PageHeader = ({ section, title, description }: DemoConfig) => (
  <div className="mb-6">
    <div className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
      {section}
    </div>
    <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
  </div>
)

/* ------------------------------------------------------------------ */
/* Catering — left-sidebar back-office, warm.                          */
/* ------------------------------------------------------------------ */
const CATERING_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Menus', icon: UtensilsCrossed },
  { label: 'Packages', icon: Package },
  { label: 'Schedule', icon: CalendarDays },
  { label: 'Customers', icon: Users },
  { label: 'Locations', icon: MapPin },
  { label: 'Settings', icon: Settings },
]

function CateringShell({ section, title, description, children }: ShellProps) {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border bg-card font-sans text-card-foreground shadow-sm">
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r bg-muted/40 md:flex">
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChefHat className="size-[1.1rem]" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Tablespread</div>
            <div className="text-[0.7rem] text-muted-foreground">Catering portal</div>
          </div>
        </div>
        <Separator />
        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-auto p-2">
          {CATERING_NAV.map(({ label, icon: Icon }) => {
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
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-4', active && 'text-primary')} />
                {label}
              </button>
            )
          })}
        </nav>
        <Separator />
        <div className="px-4 py-3">
          <Identity org="Northwind Events" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{section}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium">{title}</span>
          </div>
          <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
        </header>
        <main className="flex-1 overflow-auto p-5 md:p-8">
          <div className="max-w-3xl">
            <PageHeader section={section} title={title} description={description} />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dev console — top wordmark + tabbed strip, cool/violet, tight.      */
/* ------------------------------------------------------------------ */
const DEV_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Deployments', icon: Rocket },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Members', icon: Users },
  { label: 'Settings', icon: Settings },
]

function DevConsoleShell({ section, title, description, children }: ShellProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-md border bg-card font-sans text-card-foreground shadow-sm">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 md:px-6">
        <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
          <Terminal className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">mainline</span>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className="text-muted-foreground/40">/</span>
          acme-web
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            AR
          </span>
        </div>
      </header>
      <nav
        aria-label="Main"
        className="flex h-10 shrink-0 items-center gap-1 overflow-auto border-b px-2 md:px-4"
      >
        {DEV_NAV.map(({ label, icon: Icon }) => {
          const active = label === section
          return (
            <button
              key={label}
              type="button"
              tabIndex={-1}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          )
        })}
      </nav>
      <main className="flex-1 overflow-auto bg-muted/20 p-5 md:p-8">
        <div className="max-w-3xl">
          <PageHeader section={section} title={title} description={description} />
          {children}
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Store admin — horizontal top-bar nav, emerald, rounded/friendly.    */
/* ------------------------------------------------------------------ */
const STORE_NAV: NavItem[] = [
  { label: 'Home', icon: House },
  { label: 'Products', icon: ShoppingBag },
  { label: 'Orders', icon: ClipboardList },
  { label: 'Customers', icon: Users },
  { label: 'Discounts', icon: Tag },
  { label: 'Navigation', icon: PanelsTopLeft },
  { label: 'Settings', icon: Settings },
]

function StoreAdminShell({ section, title, description, children }: ShellProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card font-sans text-card-foreground shadow-sm">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-[1.1rem]" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Tilbury</span>
        </div>
        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 md:flex">
          {STORE_NAV.map(({ label, icon: Icon }) => {
            const active = label === section
            return (
              <button
                key={label}
                type="button"
                tabIndex={-1}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Icon className={cn('size-3.5', active && 'text-primary')} />
                {label}
              </button>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            AR
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-muted/20 p-5 md:p-8">
        <div className="max-w-3xl">
          <PageHeader section={section} title={title} description={description} />
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Registry: variant → shell + theme class + a built-in default page. The default
 * page is the fallback chrome state (active nav item, breadcrumb) used when an
 * example is shown in an app it didn't author a hint for — i.e. when the toolbar
 * forces a different app than the example's own default. An example only carries
 * a page HINT (`parameters.demo`) for its OWN default app; every other app falls
 * back to its `defaultPage` here.
 */
export const DEMO_APPS: Record<
  AppVariant,
  { Shell: ComponentType<ShellProps>; themeClass: string; label: string; defaultPage: DemoConfig }
> = {
  catering: {
    Shell: CateringShell,
    themeClass: 'theme-catering',
    label: 'Catering',
    defaultPage: { section: 'Orders', title: 'Order details' },
  },
  dev: {
    Shell: DevConsoleShell,
    themeClass: 'theme-dev',
    label: 'Dev console',
    defaultPage: { section: 'Settings', title: 'Project settings' },
  },
  store: {
    Shell: StoreAdminShell,
    themeClass: 'theme-store',
    label: 'Store admin',
    defaultPage: { section: 'Products', title: 'Edit product' },
  },
}
