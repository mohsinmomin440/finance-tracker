import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const route = { path: '/budgets/:id', layout: 'owner', access: 'authenticated' };

// Safe currency formatter for INR
const money = (v) => {
  const num = typeof v === 'number' ? v : Number(v);
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeNum);
};

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
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
      ringColor: '#64748b',
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
  let ringColor = '#10b981';
  let iconName = 'CheckCircle2';

  if (isOver) {
    statusLabel = 'Over budget';
    statusClass = 'bg-rose-500/12 text-rose-400 border-rose-500/25';
    progressGradient = 'from-rose-500 to-coral-500';
    ringColor = '#f43f5e';
    iconName = 'AlertCircle';
  } else if (isNear) {
    statusLabel = 'Near limit';
    statusClass = 'bg-amber-500/12 text-amber-400 border-amber-500/25';
    progressGradient = 'from-amber-400 to-amber-500';
    ringColor = '#f59e0b';
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
    ringColor,
    iconName,
  };
}

export default function BudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { data, loading, error, run } = useFetch(
    async () => {
      const r = await sdk.table('budgets_c').select(['Name', 'category_c', 'limit_c', 'month_c', 'note_c']).get(id);
      if (!r || r.success === false) throw new Error(r?.message || 'Budget not found');
      return Array.isArray(r.data) ? r.data[0] : (r.data ?? r);
    },
    [id]
  );

  const { data: expenses } = useFetch(
    () => sdk.table('expenses_c').select(['Name', 'amount_c', 'category_c', 'date_c', 'kind_c']).fetch().then((r) => r.data ?? []),
    []
  );

  // Exact spent calculation preserving empty/null month guard
  const matchingExpenses = (expenses ?? []).filter(
    (x) =>
      x.kind_c !== 'Income' &&
      x.category_c === data?.category_c &&
      Boolean(data?.month_c) &&
      (x.date_c || '').startsWith(data.month_c)
  );

  const spent = matchingExpenses.reduce((s, x) => s + Number(x.amount_c || 0), 0);

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const r = await sdk.table('budgets_c').remove([id]);
      if (!r.data?.length) {
        toast.error(r.messages?.[0] || 'Could not delete budget.');
        return;
      }
      toast.success('Budget deleted');
      navigate('/budgets');
    } catch (e) {
      toast.error(e.message || 'Could not delete budget.');
    } finally {
      setDeleting(false);
    }
  };

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="glass-card p-6 sm:p-9 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-60" />
            </div>
          </div>
          <div className="h-px bg-border/40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div className="glass-card p-8 sm:p-10 text-center space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-destructive/15 text-destructive border border-destructive/25 shadow-xs">
            <ApperIcon name="FileQuestion" size={32} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-foreground">Budget not found</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {typeof error === 'string'
                ? error
                : error?.message || 'The requested budget ID could not be located in your records.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40">
              <Link to="/budgets">
                <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                Back to Budgets
              </Link>
            </Button>
            <Button onClick={run} variant="ghost" className="rounded-xl">
              <ApperIcon name="RefreshCw" size={15} className="mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const m = getBudgetMetrics(data.limit_c, spent);
  const iconName = getCategoryIcon(data.category_c);
  const badgeClass = getCategoryBadgeClass(data.category_c);
  const clampedFill = Math.min(Math.max(m.pct, 0), 100);

  // SVG Circular Gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const strokeDashoffset = circumference - (clampedFill / 100) * circumference;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/budgets"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary px-1"
        >
          <ApperIcon name="ArrowLeft" size={17} />
          <span>Back to Budgets</span>
        </Link>
        <span className="text-xs text-muted-foreground font-mono">ID: {id?.slice(0, 8)}…</span>
      </div>

      {/* Main Glass Detail Card */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-9">
        {/* Subtle top aurora highlight bar */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${m.progressGradient}`}
        />

        {/* Hero Section: Circular Ring Gauge + Header Metadata */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pt-2">
          {/* Header Info */}
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className={`grid size-14 shrink-0 place-items-center rounded-2xl border shadow-sm ${badgeClass}`}>
              <ApperIcon name={iconName} size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="eyebrow">BUDGET PLAN</p>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-tight shadow-xs ${m.statusClass}`}
                >
                  <ApperIcon name={m.iconName} size={12} />
                  <span>{m.statusLabel}</span>
                </div>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate mt-1">
                {data.Name || 'Untitled budget'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-medium text-foreground/80">{data.category_c || 'General'}</span>
                <span>·</span>
                <span>{formatMonth(data.month_c) || 'Active month'}</span>
              </p>
            </div>
          </div>

          {/* Large Circular Gauge Ring */}
          <div className="relative shrink-0 flex flex-col items-center">
            <svg
              className="size-36 -rotate-90 transform"
              viewBox="0 0 160 160"
              role="progressbar"
              aria-valuenow={Math.round(m.pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${data.Name} budget circular gauge: ${Math.round(m.pct)}% used`}
            >
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-muted/40"
                strokeWidth="11"
                fill="none"
              />
              {/* Animated Progress Arc */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                stroke={m.ringColor}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeLinecap="round"
                fill="none"
                initial={prefersReducedMotion ? false : { strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
            {/* Center Percentage Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-2xl font-black text-foreground tabular-nums">
                {m.hasLimit ? `${Math.round(m.pct)}%` : '—'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {m.hasLimit ? 'Used' : 'No Limit'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-border/50" />

        {/* 3 Large Metric Blocks */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Compass" size={13} className="text-primary" />
              <span>Monthly Limit</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {m.hasLimit ? money(m.limit) : 'No limit set'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Maximum planned allowance</p>
          </div>

          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Receipt" size={13} className="text-primary" />
              <span>Total Spent</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {money(m.spent)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {matchingExpenses.length} {matchingExpenses.length === 1 ? 'transaction' : 'transactions'} this month
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name={m.isOver ? 'AlertCircle' : 'ShieldCheck'} size={13} className={m.isOver ? 'text-rose-400' : 'text-emerald-400'} />
              <span>{m.isOver ? 'Overspent Amount' : 'Remaining Balance'}</span>
            </div>
            <p
              className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${
                m.isOver ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {m.isOver ? money(m.overspent) : money(m.remaining)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.isOver ? 'Exceeded assigned limit' : 'Safe to spend remainder'}
            </p>
          </div>
        </div>

        {/* Linear Progress Bar Section */}
        <div className="mt-6 rounded-2xl border border-white/10 dark:border-white/5 bg-card/30 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Progress relative to limit</span>
            <span className="tabular-nums font-bold text-foreground">
              {m.hasLimit ? `${Math.round(m.pct)}% of target limit` : 'No limit'}
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-muted/60"
            role="progressbar"
            aria-valuenow={Math.round(m.pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${data.Name} linear progress: ${Math.round(m.pct)}% used`}
          >
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${m.progressGradient}`}
              initial={prefersReducedMotion ? false : { width: 0 }}
              animate={{ width: `${clampedFill}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Notes Block */}
        <div className="mt-4 rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ApperIcon name="StickyNote" size={13} className="text-primary" />
            <span>Notes & Intentions</span>
          </div>
          <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {data.note_c?.trim() ? (
              data.note_c
            ) : (
              <span className="text-muted-foreground italic">No notes added for this budget.</span>
            )}
          </p>
        </div>

        {/* Linked Transactions Section */}
        {matchingExpenses.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transactions in this category ({matchingExpenses.length})
              </h3>
              <Link to="/expenses" className="text-xs font-semibold text-primary hover:underline">
                View all transactions →
              </Link>
            </div>
            <div className="divide-y divide-border/40 rounded-2xl border border-white/10 dark:border-white/5 bg-card/30 overflow-hidden">
              {matchingExpenses.slice(0, 5).map((x) => (
                <div key={x.Id} className="flex items-center justify-between p-3.5 text-xs">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-semibold text-foreground truncate">{x.Name}</p>
                    <p className="text-muted-foreground mt-0.5">{x.date_c} · {x.paymentMethod_c || 'Direct'}</p>
                  </div>
                  <span className="font-bold tabular-nums text-rose-400 shrink-0">
                    −{money(x.amount_c)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions: Back & Delete */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="min-h-[44px] rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40"
          >
            <Link to="/budgets">
              <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
              All budgets
            </Link>
          </Button>

          {/* Delete Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="min-h-[44px] rounded-xl px-5 shadow-md hover:bg-destructive/90"
                disabled={deleting}
              >
                <ApperIcon name="Trash2" size={16} className="mr-2" />
                {deleting ? 'Deleting…' : 'Delete budget'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-dialog border border-glass-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl font-bold">
                  Delete this budget?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-foreground">“{data.Name || 'this budget'}”</span>? Your expense records will remain untouched, but this category ceiling will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                <AlertDialogCancel className="rounded-xl border-white/15">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={remove}
                  disabled={deleting}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete budget'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
