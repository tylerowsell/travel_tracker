'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function TripPage() {
  const { id } = useParams<{id: string}>();
  const qc = useQueryClient();
  const { data: trip } = useQuery({ queryKey: ['trip', id], queryFn: async () => (await api.get(`/trips/${id}`)).data });
  const { data: expenses } = useQuery({ queryKey: ['expenses', id], queryFn: async () => (await api.get(`/expenses/${id}`)).data });
  const { data: parts } = useQuery({ queryKey: ['parts', id], queryFn: async () => (await api.get(`/participants/${id}`)).data });
  const { data: net } = useQuery({ queryKey: ['net', id], queryFn: async () => (await api.get(`/balances/${id}/net`)).data });

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(trip?.home_currency ?? 'USD');
  const [payer, setPayer] = useState<number|undefined>(undefined);

  const addExpense = useMutation({
    mutationFn: async () => {
      if (!payer) return;
      return api.post(`/expenses/${id}`, {
        dt: new Date().toISOString().slice(0,10),
        amount: parseFloat(amount || '0'),
        currency,
        payer_id: payer,
        splits: parts.map((p:any)=>({ participant_id: p.id, share_type: 'equal' }))
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', id] });
      setAmount('');
    }
  });

  if (!trip) return <p>Loading…</p>;

  return (
    <div className="grid gap-6">
      <div className="card">
        <h2 className="text-lg font-medium">{trip.title}</h2>
        <p className="text-gray-400">{trip.start_date} → {trip.end_date} · Home {trip.home_currency}</p>
      </div>

      <div className="card grid gap-3">
        <h3 className="font-medium">Quick Add Expense</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="input" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
          <input className="input" placeholder="Currency" value={currency} onChange={e=>setCurrency(e.target.value)} />
          <select className="input" value={payer ?? ''} onChange={e=>setPayer(parseInt(e.target.value))}>
            <option value="">Payer</option>
            {parts?.map((p:any)=><option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          <button className="btn" onClick={()=>addExpense.mutate()} disabled={!amount || !payer}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-2">Expenses</h3>
        <div className="grid gap-2">
          {expenses?.map((e:any)=>(
            <div key={e.id} className="flex items-center justify-between border-b border-gray-800 pb-1">
              <div>{e.dt} — {e.category || 'Uncategorized'} · {e.amount} {e.currency}</div>
              <div className="text-gray-400">payer #{e.payer_id}</div>
            </div>
          ))}
          {(!expenses || expenses.length===0) && <p>No expenses yet.</p>}
        </div>
      </div>

      <div className="card">
        <h3 className="font-medium mb-2">Balances (home currency)</h3>
        <ul className="grid gap-1">
          {net?.map((n:any)=>(
            <li key={n.participant_id}>#{n.participant_id}: {n.net_amount_home.toFixed(2)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
