'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function NewTrip() {
  const r = useRouter();
  const [form, setForm] = useState({ title: '', home_currency: 'USD', start_date: '', end_date: '' });

  const submit = async (e: any) => {
    e.preventDefault();
    await api.post('/trips', { ...form, participants: [{ display_name: 'You', weight: 1.0 }] });
    r.push('/');
  };

  return (
    <form onSubmit={submit} className="card grid gap-3 max-w-xl">
      <h2 className="text-lg font-medium">Create Trip</h2>
      <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
      <input className="input" placeholder="Home currency (e.g., USD, EUR)" value={form.home_currency} onChange={e=>setForm({...form, home_currency:e.target.value})} />
      <input className="input" type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})} />
      <input className="input" type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})} />
      <button className="btn">Save</button>
    </form>
  );
}
