import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getCurrentMonthLocal } from '@/utils/date';

export const route = { path: '/budgets', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'ChartNoAxesCombined', label: 'Budgets', order: 30 };

const money = (v) => {
  const num = typeof v === 'number' ? v : Number(v);
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeNum);
};

const categories = [
  'Food & drink',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Subscriptions',
  'Travel',
  'Education',
  'Other',
];

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food & drink':
      return 'Utensils';
    case 'Transport':
      return 'Car';
    case 'Shopping':
      return 'ShoppingBag';
    case 'Bills':
      return 'Zap';
    case 'Health':
      return 'HeartPulse';
    case 'Entertainment':
      return 'Film';
    case 'Subscriptions':
      return 'Repeat2';
    case 'Travel':
      return 'Plane';
    case 'Education':
      return 'GraduationCap';
    default:
      return 'Wallet';
  }
};

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Food & drink':
      return 'bg-amber-500/12 text-amber-400 border-amber-500/25';
    case 'Transport':
      return 'bg-sky-500/12 text-sky-400 border-sky-500/25';
    case 'Shopping':
      return 'bg-pink-500/12 text-pink-400 border-pink-500/25';
    case 'Bills':
      return 'bg-orange-500/12 text-orange-400 border-orange-500/25';
    case 'Health':
      return 'bg-red-500/12 text-red-400 border-red-500/25';
    case 'Entertainment':
      return 'bg-purple-500/12 text-purple-400 border-purple-500/25';
    case 'Subscriptions':
      return 'bg-indigo-500/12 text-indigo-400 border-indigo-500/25';
    case 'Travel':
      return 'bg-teal-500/12 text-teal-400 border-teal-500/25';
    case 'Education':
      return 'bg-blue-500/12 text-blue-400 border-blue-500/25';
    default:
      return 'bg-violet-500/12 text-violet-400 border-violet-500/25';
  }
};

function formatMonth(m) {
  if (!m) return '';
  const [year, month] = m.split('-');
  if (!year || !month) return m;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (isNaN(date.getTime())) return m;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Robust, safe budget calculation helper
function getBudgetMetrics(limitVal, spentVal) {
  const limit = Number(limitVal);
  const spent = typeof spentVal === 'number' ? spentVal : (Number(spentVal) || 0);
  const safeSpent = isNaN(spent) || spent < 0 ? 0 : spent;

  if (isNaN(limit) || limit <= 0 || limitVal === null || limitVal === undefined) {
    return {
      hasLimit: false,
      limit: 0,
      spent: safeSpent,
      remaining: 0,
      overspent: 0,
      pct: 0,
      isOver: false,
      isNear: false,
      statusLabel: 'No limit set',
      statusClass: 'bg-muted/60 text-muted-foreground border-border/60',
      progressGradient: 'from-muted to-muted-foreground',
      iconName: 'AlertCircle',
    };
  }

  const pct = (safeSpent / limit) * 100;
  const isOver = safeSpent >= limit;
  const isNear = !isOver && pct >= 80;
  const remaining = Math.max(limit - safeSpent, 0);
  const overspent = isOver ? safeSpent - limit : 0;

  let statusLabel = 'On track';
  let statusClass = 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25';
  let progressGradient = 'from-emerald-400 to-teal-400';
  let iconName = 'CheckCircle2';

  if (isOver) {
    statusLabel = 'Over budget';
    statusClass = 'bg-rose-500/12 text-rose-400 border-rose-500/25';
    progressGradient = 'from-rose-500 to-coral-500';
    iconName = 'AlertCircle';
  } else if (isNear) {
    statusLabel = 'Near limit';
    statusClass = 'bg-amber-500/12 text-amber-400 border-amber-500/25';
    progressGradient = 'from-amber-400 to-amber-500';
    iconName = 'AlertTriangle';
  }

  return {
    hasLimit: true,
    limit,
    spent: safeSpent,
    remaining,
    overspent,
    pct,
    isOver,
    isNear,
    statusLabel,
    statusClass,
    progressGradient,
    iconName,
  };
}

export default function Budgets() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form, setForm] = useState({
    Name: '',
    category_c: 'Food & drink',
    limit_c: '',
    month_c: getCurrentMonthLocal(),
    note_c: '',
  });
  const prefersReducedMotion = useReducedMotion();

  // 300ms debounce on search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: budgets, loading, error, run } = useFetch(
    () =>
      sdk
        .table('budgets_c')
        .select(['Name', 'category_c', 'limit_c', 'month_c', 'note_c'])
        .orderByDesc('CreatedOn')
        .fetch()
        .then((r) => {
          if (!r.success) throw new Error(r.message);
          return r.data;
        }),
    []
  );

  const { data: expenses } = useFetch(
    () =>
      sdk
        .table('expenses_c')
        .select(['Name', 'amount_c', 'category_c', 'date_c', 'kind_c'])
        .fetch()
        .then((r) => {
          if (!r.success) throw new Error(r.message);
          return r.data;
        }),
    []
  );

  // Exact fixed spentFor calculation preserving empty month guard and local date
  const spentFor = (b) =>
    (expenses ?? [])
      .filter(
        (x) =>
          x.kind_c !== 'Income' &&
          x.category_c === b.category_c &&
          Boolean(b.month_c) &&
          (x.date_c || '').startsWith(b.month_c)
      )
      .reduce((s, x) => s + Number(x.amount_c || 0), 0);

  // Filtered rows with null safety on Name and category_c preserved
  const q = debouncedSearch.trim().toLowerCase();
  const rows = (budgets ?? []).filter(
    (x) =>
      (x.Name || '').toLowerCase().includes(q) ||
      (x.category_c || '').toLowerCase().includes(q)
  );

  // Summary analytics across visible budgets
  const summary = useMemo(() => {
    let totalPlanned = 0;
    let totalSpent = 0;
    let totalRemaining = 0;
    let overLimitCount = 0;

    rows.forEach((b) => {
      const s = spentFor(b);
      const m = getBudgetMetrics(b.limit_c, s);
      if (m.hasLimit) {
        totalPlanned += m.limit;
        totalSpent += m.spent;
        totalRemaining += m.remaining;
        if (m.isOver) overLimitCount++;
      }
    });

    return { totalPlanned, totalSpent, totalRemaining, overLimitCount };
  }, [rows, expenses]);

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;

    const trimmedName = form.Name.trim();
    const limitNum = Number(form.limit_c);

    if (!trimmedName) {
      toast.error('Please enter a budget name.');
      return;
    }
    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error('Please enter a positive monthly limit (greater than 0).');
      return;
    }
    if (!form.month_c) {
      toast.error('Please select a target month.');
      return;
    }

    setSaving(true);
    try {
      const r = await sdk.table('budgets_c').create({
        ...form,
        Name: trimmedName,
        limit_c: limitNum,
      });
      if (!r.data?.length) {
        toast.error(r.messages?.[0] || 'Could not save budget.');
        return;
      }
      toast.success('Budget created successfully');
      setOpen(false);
      setForm({
        Name: '',
        category_c: 'Food & drink',
        limit_c: '',
        month_c: getCurrentMonthLocal(),
        note_c: '',
      });
      run();
    } catch (err) {
      toast.error(err.message || 'Could not save budget.');
    } finally {
      setSaving(false);
    }
  };

  const hasSearchActive = Boolean(searchInput.trim());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">A PLAN THAT FEELS GOOD</p>
          <h1 className="page-title">Budgets</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set intentional spending boundaries and watch your savings grow.
          </p>
        </div>

        {/* Create Budget Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
              <ApperIcon name="Plus" size={17} className="mr-2" />
              Create budget
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dialog border border-glass-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold">
                Create monthly budget
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="budget-name" className="text-xs font-semibold">Budget name</Label>
                <Input
                  id="budget-name"
                  placeholder="e.g. Dining Out & Cafes"
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  className="rounded-xl border-border/60 bg-card/60 backdrop-blur-md"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget-category" className="text-xs font-semibold">Category</Label>
                <Select
                  value={form.category_c}
                  onValueChange={(v) => setForm({ ...form, category_c: v })}
                >
                  <SelectTrigger id="budget-category" aria-label="Select category" className="rounded-xl border-border/60 bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget-limit" className="text-xs font-semibold">Monthly limit (₹)</Label>
                <Input
                  id="budget-limit"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 8000"
                  value={form.limit_c}
                  onChange={(e) => setForm({ ...form, limit_c: e.target.value })}
                  className="rounded-xl border-border/60 bg-card/60 backdrop-blur-md tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget-month" className="text-xs font-semibold">Target month</Label>
                <Input
                  id="budget-month"
                  type="month"
                  value={form.month_c}
                  onChange={(e) => setForm({ ...form, month_c: e.target.value })}
                  className="rounded-xl border-border/60 bg-card/60 backdrop-blur-md"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget-note" className="text-xs font-semibold">Notes (optional)</Label>
                <Input
                  id="budget-note"
                  placeholder="Purpose or limits for this budget"
                  value={form.note_c}
                  onChange={(e) => setForm({ ...form, note_c: e.target.value })}
                  className="rounded-xl border-border/60 bg-card/60 backdrop-blur-md"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full min-h-[44px] rounded-xl font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? 'Creating budget…' : 'Save budget'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="metric-glass">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Active Budgets</p>
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <ApperIcon name="Target" size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {rows.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.overLimitCount > 0 ? (
              <span className="text-rose-400 font-semibold">{summary.overLimitCount} over budget</span>
            ) : (
              'All currently on track'
            )}
          </p>
        </div>

        <div className="metric-glass">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Total Planned</p>
            <div className="grid size-8 place-items-center rounded-xl bg-violet-500/10 text-violet-400">
              <ApperIcon name="Compass" size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {money(summary.totalPlanned)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Spent: <span className="text-foreground font-medium">{money(summary.totalSpent)}</span>
          </p>
        </div>

        <div className="metric-glass">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Remaining Budget</p>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ApperIcon name="ShieldCheck" size={16} />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {money(summary.totalRemaining)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Available to spend safely
          </p>
        </div>
      </div>

      {/* Debounced Search Bar */}
      <div className="glass-card p-3.5 sm:p-4">
        <div className="relative">
          <ApperIcon
            name="Search"
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            className="pl-10 pr-9 h-11 rounded-xl border-border/60 bg-card/50 backdrop-blur-md focus-visible:ring-primary text-sm"
            placeholder="Search budgets by name or category…"
            aria-label="Find a budget"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
              aria-label="Clear search text"
            >
              <ApperIcon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !budgets ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="size-11 rounded-2xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="glass-card p-8 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/25">
            <ApperIcon name="AlertTriangle" size={24} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Failed to load budgets</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {typeof error === 'string' ? error : error?.message || 'Database error while loading your budgets.'}
          </p>
          <Button
            onClick={run}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40"
          >
            <ApperIcon name="RefreshCw" size={14} className="mr-1.5" />
            Retry
          </Button>
        </div>
      ) : rows.length > 0 ? (
        /* Responsive Grid with Staggered Framer Motion Animation */
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((b, i) => {
            const spent = spentFor(b);
            const m = getBudgetMetrics(b.limit_c, spent);
            const iconName = getCategoryIcon(b.category_c);
            const badgeClass = getCategoryBadgeClass(b.category_c);
            const clampedFill = Math.min(Math.max(m.pct, 0), 100);

            return (
              <motion.div
                key={b.Id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: prefersReducedMotion ? 0 : Math.min(i, 12) * 0.04,
                  ease: 'easeOut',
                }}
              >
                <Link
                  to={`/budgets/${b.Id}`}
                  className="budget-card glass-card group relative block p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Top Bar: Category Icon Badge & Status Pill */}
                  <div className="flex items-center justify-between gap-3">
                    <div className={`grid size-11 place-items-center rounded-2xl border shadow-xs transition-transform duration-200 group-hover:scale-105 ${badgeClass}`}>
                      <ApperIcon name={iconName} size={20} />
                    </div>

                    {/* Non-color reliant status pill with icon and text */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold tracking-tight shadow-xs ${m.statusClass}`}
                    >
                      <ApperIcon name={m.iconName} size={12} />
                      <span>{m.statusLabel}</span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="mt-4">
                    <h2 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {b.Name || 'Untitled budget'}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                      <span>{b.category_c || 'General'}</span>
                      <span className="text-border" aria-hidden="true">·</span>
                      <span>{formatMonth(b.month_c) || 'Active month'}</span>
                    </p>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 pt-4 border-t border-border/40 flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Spent: </span>
                      <strong className="text-sm font-bold text-foreground tabular-nums">
                        {money(m.spent)}
                      </strong>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <span>of </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {m.hasLimit ? money(m.limit) : 'No limit'}
                      </span>
                    </div>
                  </div>

                  {/* Accessible Animated Progress Bar */}
                  <div
                    className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-muted/60"
                    role="progressbar"
                    aria-valuenow={Math.round(m.pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${b.Name} budget: ${Math.round(m.pct)}% used, ${m.statusLabel}`}
                  >
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${m.progressGradient}`}
                      initial={prefersReducedMotion ? false : { width: 0 }}
                      animate={{ width: `${clampedFill}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Bottom Stats: Real percentage & Remaining/Overspent */}
                  <div className="mt-2.5 flex items-center justify-between text-xs font-semibold tabular-nums">
                    <span className="text-muted-foreground">
                      {m.hasLimit ? `${Math.round(m.pct)}% used` : '—'}
                    </span>
                    {m.isOver ? (
                      <span className="text-rose-400 font-bold">
                        {money(m.overspent)} over
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        {money(m.remaining)} left
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : hasSearchActive ? (
        /* Empty State: Search Yielded No Matches */
        <div className="glass-card p-10 text-center space-y-3">
          <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-muted/40 border border-border/60 text-muted-foreground shadow-xs">
            <ApperIcon name="SearchX" size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">
              No matching budgets
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No budgets matched “{searchInput}”. Try checking your spelling or clearing the search query.
            </p>
          </div>
          <Button
            onClick={() => setSearchInput('')}
            variant="outline"
            size="sm"
            className="rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40"
          >
            <ApperIcon name="RotateCcw" size={13} className="mr-1.5" />
            Clear search
          </Button>
        </div>
      ) : (
        /* Empty State: Pristine (No budgets created yet) */
        <div className="glass-card p-10 text-center space-y-3">
          <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            <ApperIcon name="Target" size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-foreground">
              No budgets planned yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create monthly spending goals to stay mindful of where your money flows and protect your savings targets.
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90"
          >
            <ApperIcon name="Plus" size={15} className="mr-1.5" />
            Create your first budget
          </Button>
        </div>
      )}
    </div>
  );
}
