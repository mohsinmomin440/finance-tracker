import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLocalDate } from '@/utils/date';

export const route = { path: '/expenses', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'ArrowLeftRight', label: 'Transactions', order: 20 };

const FIELDS = ['Name', 'amount_c', 'category_c', 'date_c', 'paymentMethod_c', 'kind_c', 'note_c', 'recurring_c', 'CreatedOn'];

// Safe currency formatter for INR
const money = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  const safeNum = isNaN(num) || num === null || num === undefined ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
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

// Aurora badge tint
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

export default function Expenses() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kind, setKind] = useState('All');
  const prefersReducedMotion = useReducedMotion();

  // 300ms debounce to avoid spamming the ApperSDK database on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, loading, error, run } = useFetch(() => {
    let query = sdk.table('expenses_c').select(FIELDS).orderByDesc('date_c');
    if (debouncedSearch.trim()) query = query.where(window.ApperSDK.CoreSDK.contains('Name', debouncedSearch.trim()));
    if (kind !== 'All') query = query.where(window.ApperSDK.CoreSDK.eq('kind_c', kind));
    return query.fetch().then((result) => {
      if (!result.success) throw new Error(result.message);
      return result.data;
    });
  }, [debouncedSearch, kind]);

  const rows = data ?? [];

  // Summary figures for filtered dataset
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    rows.forEach((r) => {
      const amt = Number(r.amount_c) || 0;
      if (r.kind_c === 'Income') inflow += amt;
      else outflow += amt;
    });
    return { totalInflow: inflow, totalOutflow: outflow };
  }, [rows]);

  const hasFilterActive = Boolean(searchInput.trim() || kind !== 'All');

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setKind('All');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">YOUR MONEY MOVES</p>
          <h1 className="page-title">Transactions</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Every inflow and outflow tracked with real-time clarity.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" className="rounded-2xl border-white/15 dark:border-white/10 bg-card/60 backdrop-blur-md shadow-xs hover:border-primary/40">
            <Link to="/">
              <ApperIcon name="Plus" size={16} className="mr-2 text-primary" />
              Quick add from Overview
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 sm:p-5">
        <div className="grid gap-3.5 sm:grid-cols-[1fr_200px]">
          {/* Search with 300ms debounce */}
          <div className="relative">
            <ApperIcon
              name="Search"
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              className="pl-10 pr-9 h-11 rounded-xl border-border/60 bg-card/50 backdrop-blur-md focus-visible:ring-primary text-sm"
              placeholder="Search by transaction name…"
              aria-label="Search transactions"
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

          {/* Type Filter Select */}
          <div className="relative">
            <select
              className="field-select h-11 appearance-none pr-10 cursor-pointer"
              aria-label="Filter by transaction type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="All">All types</option>
              <option value="Expense">Expenses only</option>
              <option value="Income">Income only</option>
            </select>
            <ApperIcon
              name="ChevronDown"
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Quick Filter Pill Summary Bar */}
        <div className="mt-3.5 pt-3.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground/80">
              {rows.length} {rows.length === 1 ? 'transaction' : 'transactions'}
            </span>
            {hasFilterActive && (
              <span className="rounded-md bg-primary/15 border border-primary/25 px-2 py-0.5 text-primary text-[11px] font-semibold">
                Filtered view
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            {kind !== 'Expense' && totalInflow > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>+{money(totalInflow)}</span>
              </div>
            )}
            {kind !== 'Income' && totalOutflow > 0 && (
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="size-1.5 rounded-full bg-rose-400" />
                <span>−{money(totalOutflow)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List Card */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 sm:px-6 py-4.5 bg-card/30">
          <div>
            <h2 className="section-title text-base sm:text-lg">Activity log</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click any item to view full details or manage record
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            INR (₹)
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading && !data ? (
          <div className="divide-y divide-border/40 p-2 sm:p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3.5 px-4 py-3.5">
                <Skeleton className="size-11 rounded-2xl shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Skeleton className="h-5 w-20 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State with Retry */
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/25">
              <ApperIcon name="AlertTriangle" size={24} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Failed to load transactions</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred while communicating with the database.'}
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
          /* Active Transactions List with Framer Motion Stagger */
          <div className="divide-y divide-border/40">
            {rows.map((item, index) => {
              const isIncome = item.kind_c === 'Income';
              const amt = Number(item.amount_c) || 0;
              const formattedAmt = money(amt);
              const iconName = getCategoryIcon(item.category_c, item.kind_c);
              const badgeClass = getCategoryBadgeClass(item.category_c, item.kind_c);

              return (
                <motion.div
                  key={item.Id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay: prefersReducedMotion ? 0 : Math.min(index, 12) * 0.03,
                    ease: 'easeOut',
                  }}
                >
                  <Link
                    to={`/expenses/${item.Id}`}
                    className="transaction-row group relative flex min-h-[56px] items-center gap-3.5 px-4 sm:px-6 py-3.5 transition-all duration-200 hover:bg-white/[0.04] dark:hover:bg-white/[0.03] active:bg-white/[0.07] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    {/* Left Icon Badge with Category Glow */}
                    <div
                      className={`grid size-11 shrink-0 place-items-center rounded-2xl border shadow-xs transition-transform duration-200 group-hover:scale-105 ${badgeClass}`}
                    >
                      <ApperIcon name={iconName} size={19} />
                    </div>

                    {/* Middle Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.Name || 'Untitled transaction'}
                        </span>
                        {item.recurring_c && (
                          <span
                            className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-purple-400 shrink-0"
                            title="Recurring transaction"
                          >
                            <ApperIcon name="Repeat2" size={10} className="mr-0.5" />
                            Auto
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/75 truncate">
                          {item.category_c || 'Uncategorized'}
                        </span>
                        <span className="text-border" aria-hidden="true">·</span>
                        <span className="shrink-0">{formatDisplayDate(item.date_c)}</span>
                        {item.paymentMethod_c && (
                          <>
                            <span className="text-border hidden sm:inline" aria-hidden="true">·</span>
                            <span className="hidden sm:inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-foreground/70">
                              {item.paymentMethod_c}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Non-Color Type Conveyance */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm sm:text-base font-bold tabular-nums tracking-tight flex items-center justify-end gap-1 ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span aria-hidden="true">{isIncome ? '+' : '−'}</span>
                        <span>{formattedAmt}</span>
                      </div>

                      {/* Non-color explicit indicator badge */}
                      <div className="mt-0.5 flex items-center justify-end gap-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className="sr-only">Type: </span>
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>

                    {/* Trailing Chevron */}
                    <ApperIcon
                      name="ChevronRight"
                      size={17}
                      className="text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground shrink-0 ml-1"
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : hasFilterActive ? (
          /* Empty State: Search/Filter yielded no matches */
          <div className="empty-state p-10 text-center space-y-3">
            <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-muted/40 border border-border/60 text-muted-foreground shadow-xs">
              <ApperIcon name="SearchX" size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold text-foreground">
                No matching transactions
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No results matched your active search or filter criteria. Try clearing them or refining your terms.
              </p>
            </div>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="rounded-xl border-white/15 dark:border-white/10 hover:border-primary/40"
            >
              <ApperIcon name="RotateCcw" size={13} className="mr-1.5" />
              Reset all filters
            </Button>
          </div>
        ) : (
          /* Empty State: Pristine (No transactions recorded at all) */
          <div className="empty-state p-10 text-center space-y-3">
            <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
              <ApperIcon name="WalletCards" size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold text-foreground">
                No transactions yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Start tracking your cash flow to build mindful financial habits and keep spending aligned with your goals.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90">
              <Link to="/">
                <ApperIcon name="Plus" size={15} className="mr-1.5" />
                Add transaction from Overview
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
