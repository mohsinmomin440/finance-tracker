import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '@/hooks/useFetch';
import { useTheme } from '@/contexts/ThemeContext';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getTodayLocal, getCurrentMonthLocal, getTodayWeekday } from '@/utils/date';

// Lazy load react-apexcharts to protect initial paint time
const Chart = lazy(() => import('react-apexcharts'));

export const route = { path: '/', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'LayoutDashboard', label: 'Overview', order: 10 };

const FIELDS = ['Name', 'amount_c', 'category_c', 'date_c', 'paymentMethod_c', 'kind_c', 'note_c', 'recurring_c', 'CreatedOn'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

// Accessible Number Count-Up that respects prefers-reduced-motion and prevents wrong intermediate states
function CountUpNumber({ value, formatter = money }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof value !== 'number' || isNaN(value)) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const start = typeof prevValueRef.current === 'number' && !isNaN(prevValueRef.current)
      ? prevValueRef.current
      : 0;
    const end = value;
    prevValueRef.current = value;

    if (start === end) {
      setDisplayValue(end);
      return;
    }

    let startTime = null;
    let animId;
    const duration = 650;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span>{formatter(displayValue)}</span>;
}

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const today = getTodayLocal();
  const monthKey = getCurrentMonthLocal();
  const periodLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);

  useEffect(() => {
    setChartMounted(true);
  }, []);

  const [form, setForm] = useState({
    Name: '',
    amount_c: '',
    category_c: 'Food & drink',
    date_c: today,
    paymentMethod_c: 'UPI',
    kind_c: 'Expense',
    note_c: '',
    recurring_c: false,
  });

  const { data: expenses, loading, error, run } = useFetch(
    () => sdk.table('expenses_c').select(FIELDS).orderByDesc('date_c').limit(50).fetch().then((r) => {
      if (!r.success) throw new Error(r.message);
      return r.data;
    }),
    []
  );

  const { data: budgets } = useFetch(
    () => sdk.table('budgets_c').select(['Name', 'category_c', 'limit_c', 'month_c']).fetch().then((r) => {
      if (!r.success) throw new Error(r.message);
      return r.data;
    }),
    []
  );

  const rows = expenses ?? [];
  const monthRows = rows.filter((x) => (x.date_c || '').startsWith(monthKey));

  // Calculations: strictly respect kind_c === 'Income'
  const income = monthRows
    .filter((x) => x.kind_c === 'Income')
    .reduce((s, x) => s + (Number(x.amount_c) || 0), 0);

  const spent = monthRows
    .filter((x) => x.kind_c !== 'Income')
    .reduce((s, x) => s + (Number(x.amount_c) || 0), 0);

  const netBalance = income - spent;
  const totalBudget = (budgets ?? []).filter((x) => x.month_c === monthKey).reduce((s, x) => s + (Number(x.limit_c) || 0), 0);

  // Savings rate calculation with zero-division safeguard and sensible clamping
  const savingsRate = income > 0 ? Math.max(0, Math.min(100, Math.round(((income - spent) / income) * 100))) : null;

  const categoryTotals = useMemo(
    () => Object.entries(
      monthRows
        .filter((x) => x.kind_c !== 'Income' && x.category_c)
        .reduce((acc, x) => {
          acc[x.category_c] = (acc[x.category_c] || 0) + (Number(x.amount_c) || 0);
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]),
    [monthRows]
  );

  const topCategories = categoryTotals.slice(0, 5);
  const recent = rows.slice(0, 6);

  const now = new Date();
  const daysLeft = Math.max(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1, 1);
  const dailyAllowance = totalBudget > 0 ? Math.max(totalBudget - spent, 0) / daysLeft : 0;

  // Trend Data for Monthly Activity Chart
  const trendData = useMemo(() => {
    if (!monthRows.length) return { dates: [], income: [], expense: [] };
    const byDate = {};
    for (const item of monthRows) {
      const d = item.date_c || today;
      if (!byDate[d]) byDate[d] = { income: 0, expense: 0 };
      const amt = Number(item.amount_c) || 0;
      if (item.kind_c === 'Income') byDate[d].income += amt;
      else byDate[d].expense += amt;
    }
    const sortedDates = Object.keys(byDate).sort();
    return {
      dates: sortedDates.map((d) => {
        const parts = d.split('-');
        return parts.length === 3 ? `${parts[2]} ${new Date(d).toLocaleDateString('en-IN', { month: 'short' })}` : d;
      }),
      income: sortedDates.map((d) => byDate[d].income),
      expense: sortedDates.map((d) => byDate[d].expense),
    };
  }, [monthRows, today]);

  // Add Transaction Submit
  const saveExpense = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.Name.trim() || Number(form.amount_c) <= 0) {
      toast.error('Add a name and an amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount_c: Number(form.amount_c), recurring_c: Boolean(form.recurring_c) };
      const result = await sdk.table('expenses_c').create(payload);
      if (!result.data?.length) {
        toast.error(result.messages?.[0] || 'Could not save transaction.');
        return;
      }
      toast.success('Transaction added');
      setOpen(false);
      setForm({
        Name: '',
        amount_c: '',
        category_c: 'Food & drink',
        date_c: getTodayLocal(),
        paymentMethod_c: 'UPI',
        kind_c: 'Expense',
        note_c: '',
        recurring_c: false,
      });
      run();
    } catch (e) {
      toast.error(e.message || 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  // ApexCharts Options for Trend Chart
  const trendChartOptions = {
    chart: {
      type: 'area',
      height: 260,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Plus Jakarta Sans',
      zoom: { enabled: false },
    },
    colors: ['#10b981', '#f43f5e'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.38,
        opacityTo: 0.04,
        stops: [0, 95, 100],
      },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trendData.dates.length ? trendData.dates : ['1', '5', '10', '15', '20', '25', '30'],
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b',
          fontSize: '11px',
          fontFamily: 'Plus Jakarta Sans',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => '₹' + Math.round(val).toLocaleString('en-IN'),
        style: {
          colors: isDark ? '#94a3b8' : '#64748b',
          fontSize: '11px',
          fontFamily: 'Plus Jakarta Sans',
        },
      },
    },
    grid: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: isDark ? '#f1f5f9' : '#0f172a' },
      fontFamily: 'Plus Jakarta Sans',
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => money(val) },
    },
  };

  const trendChartSeries = [
    { name: 'Income', data: trendData.income.length ? trendData.income : [0] },
    { name: 'Expense', data: trendData.expense.length ? trendData.expense : [0] },
  ];

  // ApexCharts Options for Category Donut
  const donutLabels = topCategories.length ? topCategories.map((x) => x[0]) : ['No spending'];
  const donutSeries = topCategories.length ? topCategories.map((x) => x[1]) : [1];

  const donutChartOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'Plus Jakarta Sans',
    },
    colors: topCategories.length
      ? ['#8b5cf6', '#06b6d4', '#10b981', '#fbbf24', '#f43f5e', '#ec4899']
      : [isDark ? '#334155' : '#cbd5e1'],
    labels: donutLabels,
    stroke: { width: 0 },
    legend: {
      position: 'bottom',
      labels: { colors: isDark ? '#e2e8f0' : '#1e293b' },
      fontFamily: 'Plus Jakarta Sans',
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: '12px',
              fontFamily: 'Plus Jakarta Sans',
            },
            value: {
              show: true,
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'Outfit',
              formatter: (val) => (topCategories.length ? money(Number(val)) : '₹0'),
            },
            total: {
              show: true,
              label: 'Total Spent',
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: '11px',
              fontFamily: 'Plus Jakarta Sans',
              formatter: () => money(spent),
            },
          },
        },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => (topCategories.length ? money(val) : 'No data'),
      },
    },
    dataLabels: { enabled: false },
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header & Quick Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">{`${getTodayWeekday()}`}</span>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
              {periodLabel}
            </span>
          </div>
          <h1 className="page-title">
            Your money, <span className="title-accent">in focus.</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            A calm, intentional view of your finances for {periodLabel}.
          </p>
        </div>

        {/* Add Transaction Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-2xl px-5 neu-button bg-primary text-primary-foreground font-semibold shadow-[0_4px_18px_rgba(139,92,246,0.35)] hover:bg-primary/90">
              <ApperIcon name="Plus" size={17} className="mr-2" /> Add transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dialog sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold">Add a transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveExpense} className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-name">What was it for?</Label>
                <Input
                  id="expense-name"
                  placeholder="e.g. Weekly Groceries"
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount (₹)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount_c}
                  onChange={(e) => setForm({ ...form, amount_c: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.kind_c} onValueChange={(v) => setForm({ ...form, kind_c: v })}>
                  <SelectTrigger aria-label="Transaction type" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_c} onValueChange={(v) => setForm({ ...form, category_c: v })}>
                  <SelectTrigger aria-label="Category" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    {['Food & drink', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Subscriptions', 'Travel', 'Education', 'Other'].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={form.paymentMethod_c} onValueChange={(v) => setForm({ ...form, paymentMethod_c: v })}>
                  <SelectTrigger aria-label="Payment method" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dialog">
                    {['UPI', 'Card', 'Cash', 'Bank transfer', 'Wallet'].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={form.date_c}
                  onChange={(e) => setForm({ ...form, date_c: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-note">Note (optional)</Label>
                <Input
                  id="expense-note"
                  placeholder="Add context or tags…"
                  value={form.note_c}
                  onChange={(e) => setForm({ ...form, note_c: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button disabled={saving} type="submit" className="mt-2 h-11 rounded-xl sm:col-span-2 font-semibold">
                {saving ? 'Saving…' : 'Save transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading Skeleton */}
      {loading && !expenses ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 w-full rounded-3xl lg:col-span-2" />
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="glass-card p-8 text-center space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ApperIcon name="AlertCircle" size={24} />
          </div>
          <p className="text-sm text-destructive font-medium">
            {typeof error === 'string' ? error : error?.message || "Couldn't load dashboard data."}
          </p>
          <Button variant="outline" onClick={run} className="rounded-xl">
            <ApperIcon name="RotateCcw" size={15} className="mr-2" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards: Balance, Income, Expense, Savings Rate */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Monthly Financial Summary">
            {/* Net Flow / Balance */}
            <div className="metric-glass">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Net Flow</span>
                <span className={`metric-icon ${netBalance >= 0 ? 'green' : 'amber'}`}>
                  <ApperIcon name={netBalance >= 0 ? 'TrendingUp' : 'TrendingDown'} size={19} />
                </span>
              </div>
              <div className={`mt-4 font-display text-3xl font-bold tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netBalance >= 0 ? '+' : '−'}
                <CountUpNumber value={Math.abs(netBalance)} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {netBalance >= 0 ? 'Surplus this month' : 'Deficit this month'}
              </div>
            </div>

            {/* Income Received */}
            <div className="metric-glass">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Income</span>
                <span className="metric-icon green">
                  <ApperIcon name="ArrowDownLeft" size={19} />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
                <CountUpNumber value={income} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                From {monthRows.filter((x) => x.kind_c === 'Income').length} credits in {periodLabel}
              </div>
            </div>

            {/* Total Spent */}
            <div className="metric-glass">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Spent</span>
                <span className="metric-icon amber" style={{ color: 'var(--destructive)', background: 'rgba(244, 63, 94, 0.12)' }}>
                  <ApperIcon name="ArrowUpRight" size={19} />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
                <CountUpNumber value={spent} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Across {monthRows.filter((x) => x.kind_c !== 'Income').length} expenses logged
              </div>
            </div>

            {/* Savings Rate */}
            <div className="metric-glass">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Savings Rate</span>
                <span className="metric-icon violet">
                  <ApperIcon name="PiggyBank" size={19} />
                </span>
              </div>
              <div className="mt-4 font-display text-3xl font-bold tracking-tight text-primary">
                {savingsRate !== null ? `${savingsRate}%` : '—'}
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                  style={{ width: `${savingsRate !== null ? savingsRate : 0}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {income > 0 ? (spent > income ? 'Spending exceeded income' : `${savingsRate}% of income saved`) : 'No income recorded'}
              </div>
            </div>
          </section>

          {/* Daily Pace & Budget Allowance Hero Card */}
          <section className="glass-panel p-6 sm:p-8">
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <span>BUDGET PACING · {periodLabel}</span>
                </div>
                <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {totalBudget > 0 ? (
                    <>
                      <CountUpNumber value={dailyAllowance} />
                      <span className="text-sm font-normal text-muted-foreground ml-2">daily guide remaining</span>
                    </>
                  ) : (
                    'Set a budget to activate daily pacing'
                  )}
                </div>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
                  {totalBudget > 0
                    ? `Calculated over the ${daysLeft} days remaining in this month across your ₹${totalBudget.toLocaleString('en-IN')} total monthly budget.`
                    : 'Track your monthly spending limits across categories to unlock real-time daily spending guidance.'}
                </p>

                {totalBudget > 0 && (
                  <div className="mt-5 space-y-2 max-w-md">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Monthly budget utilized</span>
                      <span className="font-semibold text-foreground">{Math.round((spent / totalBudget) * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-primary to-rose-400 transition-all duration-500"
                        style={{ width: `${Math.min((spent / totalBudget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground/75">
                      {money(Math.max(totalBudget - spent, 0))} remaining in tracked budgets
                    </div>
                  </div>
                )}
              </div>

              {/* Orbital Graphic Decoration */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="orbit-ring">
                  <div className="orbit-inner">
                    <ApperIcon name="Sprout" size={26} />
                    <span className="mt-1.5 text-[11px] font-semibold tracking-tight text-emerald-400">
                      Mindful<br />Wealth
                    </span>
                  </div>
                </div>
                <span className="orbit-dot dot-one" />
                <span className="orbit-dot dot-two" />
                <span className="orbit-dot dot-three" />
              </div>
            </div>
          </section>

          {/* Charts Section: Monthly Trend & Category Donut */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Monthly Trend Area Chart */}
            <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between" aria-label="Monthly Cashflow Trend Chart">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h2 className="section-title">Cashflow Trend</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Income vs Expenses over {periodLabel}</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Amounts in INR
                </span>
              </div>

              <div className="sr-only">
                Trend summary: Total income ₹{income}, total spent ₹{spent} for {periodLabel}.
              </div>

              <div className="pt-4 min-h-[260px] flex items-center justify-center">
                {chartMounted && (
                  <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-2xl" />}>
                    <div className="w-full">
                      <Chart options={trendChartOptions} series={trendChartSeries} type="area" height={260} />
                    </div>
                  </Suspense>
                )}
              </div>
            </div>

            {/* Spending Breakdown Donut Chart */}
            <div className="glass-card p-6 flex flex-col justify-between" aria-label="Category Spending Breakdown Chart">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h2 className="section-title">Where It Goes</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Top spending categories</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {topCategories.length} tracked
                </span>
              </div>

              <div className="sr-only">
                Category spending: {topCategories.map(([c, a]) => `${c}: ₹${a}`).join(', ')}
              </div>

              <div className="pt-2 min-h-[260px] flex items-center justify-center">
                {chartMounted && (
                  <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-2xl" />}>
                    <div className="w-full flex justify-center">
                      <Chart options={donutChartOptions} series={donutSeries} type="donut" height={280} width="100%" />
                    </div>
                  </Suspense>
                )}
              </div>
            </div>
          </section>

          {/* Recent Activity Section */}
          <section className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="section-title">Recent Activity</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest moves in your financial story</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-xl text-primary font-semibold hover:bg-primary/10">
                <Link to="/expenses" className="flex items-center gap-1.5">
                  View all <ApperIcon name="ArrowRight" size={15} />
                </Link>
              </Button>
            </div>

            {recent.length ? (
              <div className="divide-y divide-border/40">
                {recent.map((x) => (
                  <Link
                    to={`/expenses/${x.Id}`}
                    key={x.Id}
                    className="transaction-row group transition-all hover:bg-accent/50 focus-visible:bg-accent/50 outline-none"
                  >
                    <div
                      className={`transaction-icon ${x.kind_c === 'Income' ? 'income' : 'expense'} transition-transform group-hover:scale-105`}
                    >
                      <ApperIcon
                        name={
                          x.kind_c === 'Income'
                            ? 'ArrowDownLeft'
                            : x.category_c === 'Transport'
                            ? 'TrainFront'
                            : x.category_c === 'Food & drink'
                            ? 'Coffee'
                            : x.category_c === 'Subscriptions'
                            ? 'Repeat2'
                            : 'Receipt'
                        }
                        size={18}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {x.Name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-2">
                        <span>{x.category_c}</span>
                        <span>·</span>
                        <span>{x.date_c}</span>
                        {x.paymentMethod_c && (
                          <>
                            <span>·</span>
                            <span className="rounded-md bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium">
                              {x.paymentMethod_c}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        x.kind_c === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {x.kind_c === 'Income' ? '+' : '−'}
                      {money(x.amount_c)}
                    </div>
                    <ApperIcon
                      name="ChevronRight"
                      size={16}
                      className="text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              /* Friendly Empty State with Add Action */
              <div className="empty-state p-12">
                <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <ApperIcon name="ReceiptText" size={28} />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">No transactions logged yet</h3>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Start tracking your money journey by adding your first income or expense transaction.
                </p>
                <Button onClick={() => setOpen(true)} size="sm" className="mt-2 rounded-xl neu-button">
                  <ApperIcon name="Plus" size={15} className="mr-1.5" /> Add transaction
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
