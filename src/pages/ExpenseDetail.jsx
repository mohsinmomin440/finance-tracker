import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { formatLocalDate } from '@/utils/date';

export const route = { path: '/expenses/:id', layout: 'owner', access: 'authenticated' };
const FIELDS = ['Name', 'amount_c', 'category_c', 'date_c', 'paymentMethod_c', 'kind_c', 'note_c', 'recurring_c', 'CreatedOn'];

// Safe currency formatter for INR with 2 decimals
const money = (v) => {
  const num = typeof v === 'number' ? v : Number(v);
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(safeNum);
};

// Safe local date formatter
const formatDisplayDate = (d) => {
  if (!d) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(day));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  const formatted = formatLocalDate(d, 'MMM d, yyyy');
  return formatted && formatted !== 'Invalid Date' ? formatted : d;
};

// Category icon mapper
const getCategoryIcon = (category, kind) => {
  if (kind === 'Income') return 'ArrowDownLeft';
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
      return 'Receipt';
  }
};

// Category badge colors
const getCategoryBadgeClass = (category, kind) => {
  if (kind === 'Income') {
    return 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25';
  }
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
      return 'bg-rose-500/12 text-rose-400 border-rose-500/25';
  }
};

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, run } = useFetch(
    async () => {
      const r = await sdk.table('expenses_c').select(FIELDS).get(id);
      if (!r || r.success === false) throw new Error(r?.message || 'Transaction not found');
      return Array.isArray(r.data) ? r.data[0] : (r.data ?? r);
    },
    [id]
  );

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const r = await sdk.table('expenses_c').remove([id]);
      if (!r.data?.length) {
        toast.error(r.messages?.[0] || 'Could not delete transaction.');
        return;
      }
      toast.success('Transaction deleted');
      navigate('/expenses');
    } catch (e) {
      toast.error(e.message || 'Could not delete transaction.');
    } finally {
      setDeleting(false);
    }
  };

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-6 w-36">
          <Skeleton className="h-5 w-32 rounded-lg" />
        </div>
        <div className="glass-card p-6 sm:p-9 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="h-px bg-border/40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
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
            <h2 className="font-display text-xl font-bold text-foreground">Transaction not found</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {typeof error === 'string'
                ? error
                : error?.message || 'The requested transaction ID could not be located in your records.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40">
              <Link to="/expenses">
                <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
                Back to Transactions
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

  const isIncome = data.kind_c === 'Income';
  const iconName = getCategoryIcon(data.category_c, data.kind_c);
  const badgeClass = getCategoryBadgeClass(data.category_c, data.kind_c);
  const amt = Number(data.amount_c) || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/expenses"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary px-1"
        >
          <ApperIcon name="ArrowLeft" size={17} />
          <span>Back to Transactions</span>
        </Link>
        <span className="text-xs text-muted-foreground font-mono">ID: {id?.slice(0, 8)}…</span>
      </div>

      {/* Main Glass Detail Card */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-9">
        {/* Subtle top aurora highlight bar */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
            isIncome
              ? 'from-emerald-400 via-teal-400 to-primary'
              : 'from-rose-500 via-pink-500 to-amber-500'
          }`}
        />

        {/* Header Block: Category, Title & Big Amount Display */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start pt-2">
          <div className="flex items-start gap-4 min-w-0">
            <div className={`grid size-14 shrink-0 place-items-center rounded-2xl border shadow-sm ${badgeClass}`}>
              <ApperIcon name={iconName} size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="eyebrow">TRANSACTION DETAIL</p>
                {data.recurring_c && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    <ApperIcon name="Repeat2" size={11} />
                    Recurring
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate mt-1">
                {data.Name || 'Untitled transaction'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <span>{data.category_c || 'Uncategorized'}</span>
                <span>·</span>
                <span>{formatDisplayDate(data.date_c)}</span>
              </p>
            </div>
          </div>

          {/* Amount Display with Non-Color Indicators */}
          <div className="sm:text-right shrink-0">
            <div
              className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums flex items-center sm:justify-end gap-1 ${
                isIncome ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span aria-hidden="true">{isIncome ? '+' : '−'}</span>
              <span>{money(amt)}</span>
            </div>
            <div className="mt-1 flex items-center sm:justify-end gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                  isIncome
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                }`}
              >
                <ApperIcon name={isIncome ? 'ArrowDownLeft' : 'ArrowUpRight'} size={12} />
                <span>{isIncome ? 'Income / Inflow' : 'Expense / Outflow'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-border/50" />

        {/* Specification Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Type Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Tag" size={13} className="text-primary" />
              <span>Record Type</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground flex items-center gap-2">
              <span className={`size-2 rounded-full ${isIncome ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'}`} />
              <span>{data.kind_c || 'Expense'}</span>
            </div>
          </div>

          {/* Category Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Folder" size={13} className="text-primary" />
              <span>Category</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {data.category_c || 'None'}
            </div>
          </div>

          {/* Payment Method Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="CreditCard" size={13} className="text-primary" />
              <span>Payment Method</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {data.paymentMethod_c || 'Not specified'}
            </div>
          </div>

          {/* Date Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Calendar" size={13} className="text-primary" />
              <span>Transaction Date</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {formatDisplayDate(data.date_c)}
            </div>
          </div>

          {/* Recurring Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Repeat" size={13} className="text-primary" />
              <span>Recurring Schedule</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {data.recurring_c ? 'Yes, recurring' : 'One-time transaction'}
            </div>
          </div>

          {/* Created On Timestamp Item */}
          <div className="rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4 transition-colors">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ApperIcon name="Clock" size={13} className="text-primary" />
              <span>Logged At</span>
            </div>
            <div className="mt-1.5 text-sm font-semibold text-foreground">
              {data.CreatedOn ? formatLocalDate(data.CreatedOn, 'MMM d, yyyy h:mm a') : 'Recently'}
            </div>
          </div>
        </div>

        {/* Note Callout */}
        <div className="mt-4 rounded-2xl border border-white/10 dark:border-white/5 bg-card/40 backdrop-blur-md p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ApperIcon name="StickyNote" size={13} className="text-primary" />
            <span>Note / Remarks</span>
          </div>
          <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {data.note_c?.trim() ? data.note_c : <span className="text-muted-foreground italic">No note added to this transaction.</span>}
          </p>
        </div>

        {/* Action Controls & Delete Dialog */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="min-h-[44px] rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40"
          >
            <Link to="/expenses">
              <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
              All transactions
            </Link>
          </Button>

          {/* Delete with Confirmation Guard */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="min-h-[44px] rounded-xl px-5 shadow-md hover:bg-destructive/90"
                disabled={deleting}
              >
                <ApperIcon name="Trash2" size={16} className="mr-2" />
                {deleting ? 'Deleting…' : 'Delete transaction'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-dialog border border-glass-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-xl font-bold">
                  Delete this transaction?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-foreground">“{data.Name || 'this transaction'}”</span> ({money(amt)})? This action will permanently remove it from your records and recalculate your overview metrics.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
                <AlertDialogCancel className="rounded-xl border-white/15">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={remove}
                  disabled={deleting}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
