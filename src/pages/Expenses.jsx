import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const route = { path: '/expenses', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'ArrowLeftRight', label: 'Transactions', order: 20 };

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const FIELDS = ['Name', 'amount_c', 'category_c', 'date_c', 'paymentMethod_c', 'kind_c', 'note_c', 'recurring_c', 'CreatedOn'];

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('All');
  const { data, loading, error, run } = useFetch(() => {
    let query = sdk.table('expenses_c').select(FIELDS).orderByDesc('date_c');
    if (search.trim()) query = query.where(window.ApperSDK.CoreSDK.contains('Name', search.trim()));
    if (kind !== 'All') query = query.where(window.ApperSDK.CoreSDK.eq('kind_c', kind));
    return query.fetch().then((result) => {
      if (!result.success) throw new Error(result.message);
      return result.data;
    });
  }, [search, kind]);
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">YOUR MONEY MOVES</p>
          <h1 className="page-title">Transactions</h1>
          <p className="mt-2 text-sm text-muted-foreground">Every little choice, all in one place.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Quick add from overview
          </Link>
        </Button>
      </div>
      <div className="glass-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div className="relative">
            <ApperIcon name="Search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search transactions…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <select className="field-select" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option>All</option>
            <option>Expense</option>
            <option>Income</option>
          </select>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="section-title">All activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">{rows.length} transactions</p>
          </div>
          <span className="text-xs text-muted-foreground">Amounts in INR</span>
        </div>
        {loading && !data ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">{error.message} <button onClick={run} className="underline">Retry</button></div>
        ) : rows.length ? (
          <div className="divide-y divide-border/50">
            {rows.map((item) => (
              <Link to={`/expenses/${item.Id}`} key={item.Id} className="transaction-row">
                <div className={`transaction-icon ${item.kind_c === 'Income' ? 'income' : 'expense'}`}><ApperIcon name="Receipt" size={18} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.Name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.category_c} · {item.date_c} · {item.paymentMethod_c}</div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${item.kind_c === 'Income' ? 'text-success' : ''}`}>{item.kind_c === 'Income' ? '+' : '−'}{money(item.amount_c)}</div>
                <ApperIcon name="ChevronRight" size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><ApperIcon name="SearchX" size={28} /><p>No transactions match. Try another search or add a transaction from Overview.</p></div>
        )}
      </div>
    </div>
  );
}
