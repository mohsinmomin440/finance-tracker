import { Outlet, NavLink } from 'react-router-dom';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import ApperIcon from '@/components/ApperIcon';
import UserMenu from '@/components/UserMenu';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const fallbackLinks = [
  { to: '/', label: 'Overview', icon: 'LayoutDashboard' },
  { to: '/expenses', label: 'Transactions', icon: 'ArrowLeftRight' },
  { to: '/budgets', label: 'Budgets', icon: 'ChartNoAxesCombined' },
];

export default function OwnerLayout() {
  const { displayName, initials, navItems } = useOwnerLayoutData();
  const items = navItems?.length ? navItems : fallbackLinks;

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="glass-sidebar lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="brand-mark"><ApperIcon name="WalletCards" size={23} /></div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight">Glassflow</div>
            <div className="text-xs text-sidebar-foreground/60">PERSONAL FINANCE</div>
          </div>
        </div>
        <div className="px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/40">Workspace</div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-col">
          {items.map((item) => {
            const to = item.path || item.to;
            return (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
                <ApperIcon name={item.icon || 'Circle'} size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="mx-4 mt-auto mb-5 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:block">
          <div className="mb-2 flex items-center gap-2 text-xs text-sidebar-foreground/65"><ApperIcon name="Sparkles" size={14} /> YOUR MONEY, MINDFULLY</div>
          <p className="font-display text-lg leading-snug">Small choices. Bigger freedom.</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-sidebar-primary" /></div>
          <p className="mt-2 text-[11px] text-sidebar-foreground/50">Every choice adds up.</p>
        </div>
        <div className="border-t border-sidebar-border px-5 py-4 text-sm text-sidebar-foreground/70">
          <div className="flex items-center gap-3"><div className="avatar-orb">{initials || 'M'}</div><div className="min-w-0 flex-1"><div className="truncate font-semibold text-sidebar-foreground">{displayName || 'My workspace'}</div><div className="text-xs">Personal account</div></div><UserMenu /></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 lg:ml-64">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-background/70 px-5 py-3 backdrop-blur-xl sm:px-8">
          <div className="text-xs font-medium tracking-wide text-muted-foreground">YOUR FINANCIAL SPACE <span className="mx-2">/</span> <span className="text-foreground">PRIVATE & PERSONAL</span></div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" /> All caught up</div>
        </div>
        <div className="mx-auto max-w-[1500px] p-4 sm:p-7 xl:p-9">
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
