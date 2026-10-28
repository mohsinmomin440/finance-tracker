import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';

const fallbackLinks = [
  { to: '/', label: 'Overview', icon: 'LayoutDashboard' },
  { to: '/expenses', label: 'Transactions', icon: 'ArrowLeftRight' },
  { to: '/budgets', label: 'Budgets', icon: 'ChartNoAxesCombined' },
];

export default function OwnerLayout() {
  const { displayName, initials, navItems } = useOwnerLayoutData();
  const items = navItems?.length ? navItems : fallbackLinks;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mobile dock logic: show up to 4 items directly + a "More" drawer if > 5 items
  const hasOverflow = items.length > 5;
  const dockDirectItems = hasOverflow ? items.slice(0, 4) : items;
  const dockMoreItems = hasOverflow ? items.slice(4) : [];

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Desktop Frosted Glass Sidebar */}
      <aside className="glass-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col border-r border-sidebar-border">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 px-7 py-7">
          <div className="brand-mark shrink-0">
            <ApperIcon name="WalletCards" size={22} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-xl font-bold tracking-tight text-sidebar-foreground">Glassflow</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/50">
              Personal Finance
            </div>
          </div>
        </div>

        <div className="px-5 pb-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-sidebar-foreground/40">
          Navigation
        </div>

        {/* Dynamic Sidebar Links */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto" aria-label="Main Navigation">
          {items.map((item) => {
            const to = item.path || item.to;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center gap-3.5 px-4 py-3 min-h-[46px] rounded-2xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                    isActive
                      ? 'bg-primary/12 text-primary border border-primary/25 shadow-[0_0_20px_-4px_rgba(139,92,246,0.25)] font-bold'
                      : 'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Non-color active indicator shape + glow */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-primary shadow-[0_0_12px_var(--primary)]"
                        aria-hidden="true"
                      />
                    )}
                    <ApperIcon
                      name={item.icon || 'Circle'}
                      size={19}
                      className={isActive ? 'text-primary' : 'text-sidebar-foreground/60'}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Aurora Mindful Spending Card */}
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 dark:border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
            <ApperIcon name="Sparkles" size={14} />
            <span>MINDFUL MONEY</span>
          </div>
          <p className="font-display text-sm font-medium leading-snug text-sidebar-foreground/90">
            Small choices. Bigger financial freedom.
          </p>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-emerald-400" />
          </div>
          <p className="mt-2 text-[11px] text-sidebar-foreground/50">Intentional with every rupee.</p>
        </div>

        {/* User Account Footer */}
        <div className="border-t border-sidebar-border/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="avatar-orb text-xs font-bold shrink-0">{initials || 'M'}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">{displayName || 'My workspace'}</div>
              <div className="text-[11px] text-sidebar-foreground/60">Personal account</div>
            </div>
            <UserMenu />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Mobile Sticky Glass Header */}
        <header className="sticky top-0 z-30 flex lg:hidden items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="brand-mark size-8 rounded-xl">
              <ApperIcon name="WalletCards" size={17} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Glassflow</span>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu />
          </div>
        </header>

        {/* Desktop Sticky Header Banner */}
        <header className="sticky top-0 z-20 hidden lg:flex items-center justify-between border-b border-border/40 bg-background/70 px-8 py-3.5 backdrop-blur-xl">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            YOUR FINANCIAL SPACE <span className="mx-2 text-border">/</span>{' '}
            <span className="text-foreground">PRIVATE & PERSONAL</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground shadow-xs">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>All caught up</span>
          </div>
        </header>

        {/* Page Content with safe-dock-pb to prevent mobile dock overlap */}
        <main className="flex-1 p-4 sm:p-7 xl:p-9 pb-28 lg:pb-12 safe-dock-pb">
          <div className="mx-auto max-w-[1500px]">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile Floating Glass Dock (Bottom Navigation) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3 inset-x-3 sm:inset-x-8 z-40 lg:hidden flex items-center justify-around rounded-3xl border border-white/15 dark:border-white/10 bg-background/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.38)] p-1.5"
      >
        {dockDirectItems.map((item) => {
          const to = item.path || item.to;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-h-[46px] min-w-[50px] px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'text-primary font-bold bg-primary/12 border border-primary/20 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicator shape + glow */}
                  {isActive && (
                    <span
                      className="absolute -top-1 size-1 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
                      aria-hidden="true"
                    />
                  )}
                  <ApperIcon name={item.icon || 'Circle'} size={18} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Overflow "More" Drawer for >5 items */}
        {hasOverflow && (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-center justify-center min-h-[46px] min-w-[50px] px-3 py-1.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="More navigation options"
              >
                <ApperIcon name="MoreHorizontal" size={18} />
                <span className="text-[10px] tracking-tight">More</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="glass-dialog p-5 border-t border-glass-border">
              <DrawerHeader className="text-left px-0 pb-4">
                <DrawerTitle className="font-display text-xl font-bold">More Navigation</DrawerTitle>
                <DrawerDescription className="text-xs text-muted-foreground">
                  Explore all personal finance sections
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid grid-cols-2 gap-2.5 py-2">
                {dockMoreItems.map((item) => {
                  const to = item.path || item.to;
                  return (
                    <DrawerClose asChild key={to}>
                      <NavLink
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                          `flex items-center gap-3 p-3 rounded-2xl border text-sm font-semibold min-h-[46px] transition-all ${
                            isActive
                              ? 'bg-primary/15 border-primary/30 text-primary font-bold shadow-xs'
                              : 'bg-card/60 border-border/50 text-foreground hover:bg-card'
                          }`
                        }
                      >
                        <ApperIcon name={item.icon || 'Circle'} size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    </DrawerClose>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </nav>
    </div>
  );
}
