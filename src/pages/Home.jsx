import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getTodayLocal, getCurrentMonthLocal, getTodayWeekday } from '@/utils/date';

export const route = { path: '/', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'LayoutDashboard', label: 'Overview', order: 10 };

const FIELDS = ['Name', 'amount_c', 'category_c', 'date_c', 'paymentMethod_c', 'kind_c', 'note_c', 'recurring_c', 'CreatedOn'];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function Home() {
  const today = getTodayLocal();
  const monthKey = getCurrentMonthLocal();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const income = monthRows.filter((x) => x.kind_c === 'Income').reduce((s, x) => s + Number(x.amount_c || 0), 0);
  const spent = monthRows.filter((x) => x.kind_c !== 'Income').reduce((s, x) => s + Number(x.amount_c || 0), 0);
  const totalBudget = (budgets ?? []).filter((x) => x.month_c === monthKey).reduce((s, x) => s + Number(x.limit_c || 0), 0);

  const categoryTotals = useMemo(
    () => Object.entries(
      monthRows
        .filter((x) => x.kind_c !== 'Income' && x.category_c)
        .reduce((acc, x) => {
          acc[x.category_c] = (acc[x.category_c] || 0) + Number(x.amount_c || 0);
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [expenses, monthKey]
  );

  const maxCategoryAmount = Math.max(...categoryTotals.map((x) => x[1]), 1);
  const recent = rows.slice(0, 5);

  const now = new Date();
  const daysLeft = Math.max(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1, 1);
  const dailyAllowance = totalBudget > 0 ? Math.max(totalBudget - spent, 0) / daysLeft : 0;

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

  return (
    <div className="space-y-7 animate-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{`${getTodayWeekday()}, FINANCIAL CLARITY`}</p>
          <h1 className="page-title">Your money, <span className="title-accent">in focus.</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">A calmer view of your spending this month.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl px-5">
              <ApperIcon name="Plus" size={17} className="mr-2" /> Add transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dialog sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Add a transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveExpense} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-name">What was it for?</Label>
                <Input id="expense-name" placeholder="e.g. Lunch with friends" value={form.Name} onChange={(e) => setForm({ ...form, Name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount (₹)</Label>
                <Input id="expense-amount" type="number" min="1" step="0.01" placeholder="0.00" value={form.amount_c} onChange={(e) => setForm({ ...form, amount_c: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.kind_c} onValueChange={(v) => setForm({ ...form, kind_c: v })}>
                  <SelectTrigger aria-label="Transaction type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category_c} onValueChange={(v) => setForm({ ...form, category_c: v })}>
                  <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Food & drink', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Subscriptions', 'Travel', 'Education', 'Other'].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment method</Label>
                <Select value={form.paymentMethod_c} onValueChange={(v) => setForm({ ...form, paymentMethod_c: v })}>
                  <SelectTrigger aria-label="Payment method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['UPI', 'Card', 'Cash', 'Bank transfer', 'Wallet'].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input id="expense-date" type="date" value={form.date_c} onChange={(e) => setForm({ ...form, date_c: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-note">Note (optional)</Label>
                <Input id="expense-note" placeholder="Add a little context…" value={form.note_c} onChange={(e) => setForm({ ...form, note_c: e.target.value })} />
              </div>
              <Button disabled={saving} type="submit" className="mt-2 h-11 rounded-xl sm:col-span-2">
                {saving ? 'Saving…' : 'Save transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="balance-hero glass-panel">
        <div className="relative z-10 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> MONTHLY NET FLOW
            </div>
            <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {money(income - spent)}
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
              Your income minus expenses this month. Every small decision is part of the bigger picture.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="hero-mini">
                <span className="hero-mini-icon"><ApperIcon name="ArrowDownLeft" size={16} /></span>
                <div>
                  <div className="text-xs text-white/55">Money in</div>
                  <div className="mt-1 font-semibold text-white">{money(income)}</div>
                </div>
              </div>
              <div className="hero-mini">
                <span className="hero-mini-icon violet"><ApperIcon name="ArrowUpRight" size={16} /></span>
                <div>
                  <div className="text-xs text-white/55">Money out</div>
                  <div className="mt-1 font-semibold text-white">{money(spent)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-orbit flex min-h-[170px] items-center justify-center">
            <div className="orbit-ring">
              <div className="orbit-inner">
                <ApperIcon name="Sprout" size={28} />
                <span className="mt-2 text-xs text-white/65">intentional<br />spending</span>
              </div>
            </div>
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
            <span className="orbit-dot dot-three" />
          </div>
        </div>
        <div className="relative z-10 mt-7 border-t border-white/15 pt-4">
          <div className="flex justify-between text-xs text-white/65">
            <span>Monthly budget used</span>
            <span>{totalBudget ? Math.round((spent / totalBudget) * 100) : 0}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all"
              style={{ width: `${Math.min(totalBudget ? (spent / totalBudget) * 100 : 0, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/50">
            {totalBudget ? money(Math.max(totalBudget - spent, 0)) + ' remaining in your tracked budgets' : 'Set a budget to unlock your daily spending allowance.'}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total spent', value: money(spent), icon: 'TrendingDown', hint: 'This month', tone: 'green' },
          { label: 'Income received', value: money(income), icon: 'Wallet', hint: 'This month', tone: 'violet' },
          { label: 'Transactions', value: String(monthRows.length), icon: 'ArrowLeftRight', hint: 'Logged this month', tone: 'blue' },
          { label: 'Budget left', value: money(Math.max(totalBudget - spent, 0)), icon: 'Target', hint: totalBudget ? 'Across your budgets' : 'No budgets yet', tone: 'amber' },
        ].map((item) => (
          <div className="metric-glass" key={item.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className={`metric-icon ${item.tone}`}><ApperIcon name={item.icon} size={18} /></span>
            </div>
            <div className="mt-4 font-display text-2xl font-semibold tracking-tight">{loading ? '—' : item.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{item.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="section-title">Where it goes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your top spending categories</p>
            </div>
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">This month</span>
          </div>
          <div className="mt-6 space-y-5">
            {categoryTotals.length ? (
              categoryTotals.map(([category, amount], i) => (
                <div key={category}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span>{category}</span>
                    <span className="font-semibold tabular-nums">{money(amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`category-bar category-${i + 1}`}
                      style={{ width: `${Math.max((amount / maxCategoryAmount) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <ApperIcon name="ChartNoAxesColumn" size={24} />
                <p>No spending data yet. Add your first transaction.</p>
              </div>
            )}
          </div>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3" to="/expenses">
            Explore transactions <ApperIcon name="ArrowRight" size={16} />
          </Link>
        </div>
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="section-title">A little insight</h2>
              <p className="mt-1 text-sm text-muted-foreground">A smarter nudge for your money</p>
            </div>
            <span className="insight-spark"><ApperIcon name="Sparkles" size={18} /></span>
          </div>
          <div className="insight-feature mt-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <ApperIcon name="Compass" size={15} /> Daily allowance
            </div>
            <div className="mt-3 font-display text-3xl font-semibold">
              {totalBudget > 0 ? money(dailyAllowance) : '—'}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A gentle daily guide based on the budget you've set and the days left in this month.
            </p>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-border/60 bg-background/35 p-4">
            <ApperIcon name="Lightbulb" size={18} className="mt-0.5 shrink-0 text-[var(--highlight)]" />
            <div>
              <div className="text-sm font-semibold">Tiny habit, lasting impact</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {categoryTotals[0]
                  ? `${categoryTotals[0][0]} is your biggest tracked category this month. A quick weekly check-in can help you keep it intentional.`
                  : 'Log a few transactions to unlock personalised spending insights.'}
              </p>
            </div>
          </div>
          <Link to="/budgets" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Tune your budgets <ApperIcon name="ArrowRight" size={16} />
          </Link>
        </div>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
          <div>
            <h2 className="section-title">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">The latest moves in your money story</p>
          </div>
          <Link to="/expenses" className="text-sm font-semibold text-primary">View all</Link>
        </div>
        {error ? (
          <div className="px-6 pb-6 text-sm text-destructive">
            {typeof error === 'string' ? error : error?.message || "Couldn't load transactions."}{' '}
            <button onClick={run} className="underline">Try again</button>
          </div>
        ) : recent.length ? (
          <div className="divide-y divide-border/50">
            {recent.map((x) => (
              <Link to={`/expenses/${x.Id}`} key={x.Id} className="transaction-row">
                <div className={`transaction-icon ${x.kind_c === 'Income' ? 'income' : 'expense'}`}>
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
                  <div className="truncate text-sm font-semibold">{x.Name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{x.category_c} <span className="mx-1.5">·</span> {x.date_c}</div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${x.kind_c === 'Income' ? 'text-[var(--success)]' : ''}`}>
                  {x.kind_c === 'Income' ? '+' : '−'}{money(x.amount_c)}
                </div>
                <ApperIcon name="ChevronRight" size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ApperIcon name="Receipt" size={26} />
            <p>Your transactions will show up here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
