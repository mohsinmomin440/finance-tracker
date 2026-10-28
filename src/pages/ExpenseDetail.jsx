import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { sdk } from '@/services/sdk';
import ApperIcon from '@/components/ApperIcon';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const route = { path: '/expenses/:id', layout: 'owner', access: 'authenticated' };
const FIELDS = ['Name','amount_c','category_c','date_c','paymentMethod_c','kind_c','note_c','recurring_c','CreatedOn'];
const money = v => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v||0);
export default function ExpenseDetail() {
 const {id}=useParams(); const navigate=useNavigate(); const [deleting,setDeleting]=useState(false);
 const {data,loading,error,run}=useFetch(async()=>{const r=await sdk.table('expenses_c').select(FIELDS).get(id); return r.data;},[id]);
 const remove=async()=>{setDeleting(true);try{const r=await sdk.table('expenses_c').remove([id]);if(!r.data?.length){toast.error(r.messages?.[0]||'Could not delete transaction.');return;}toast.success('Transaction deleted');navigate('/expenses');}catch(e){toast.error(e.message||'Could not delete transaction.');}finally{setDeleting(false);}};
 if(loading&&!data)return <div className="glass-card p-8">Loading transaction…</div>;
 if(error||!data)return <div className="glass-card p-8"><p>Transaction not found.</p><Link className="mt-4 inline-block text-primary" to="/expenses">Back to Transactions</Link></div>;
 return <div className="mx-auto max-w-3xl space-y-6"><Link to="/expenses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ApperIcon name="ArrowLeft" size={16}/> Back to Transactions</Link><div className="glass-card p-6 sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><div className={`transaction-icon mb-5 ${data.kind_c==='Income'?'income':'expense'}`}><ApperIcon name="Receipt" size={22}/></div><p className="eyebrow">TRANSACTION DETAIL</p><h1 className="page-title">{data.Name}</h1><p className="mt-2 text-sm text-muted-foreground">{data.category_c} · {data.date_c}</p></div><div className="font-display text-3xl font-semibold">{data.kind_c==='Income'?'+':'−'}{money(data.amount_c)}</div></div><div className="my-7 h-px bg-border/60"/><div className="grid gap-5 sm:grid-cols-2">{[['Type',data.kind_c],['Category',data.category_c],['Payment method',data.paymentMethod_c],['Date',data.date_c],['Recurring',data.recurring_c?'Yes':'No'],['Note',data.note_c||'No note added']].map(([k,v])=><div key={k}><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><div className="mt-2 text-sm font-medium">{v}</div></div>)}</div><div className="mt-8 flex flex-wrap justify-end gap-3"><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="rounded-xl" disabled={deleting}><ApperIcon name="Trash2" size={16} className="mr-2"/>Delete transaction</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this transaction?</AlertDialogTitle><AlertDialogDescription>This will permanently remove “{data.Name}” from your records.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} disabled={deleting}>{deleting?'Deleting…':'Delete transaction'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div></div>;
}
