'use client';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Link from 'next/link';

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => (await api.get('/trips')).data
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Failed to load trips</p>;

  return (
    <div className="grid gap-4">
      {data?.length === 0 && <p>No trips yet. Click "New Trip" to create one.</p>}
      {data?.map((t: any) => (
        <Link href={`/trip/${t.id}`} key={t.id} className="card block">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl">{t.title}</h2>
              <p className="text-sm text-gray-400">
                {t.start_date} → {t.end_date} · Home currency: {t.home_currency}
              </p>
            </div>
            <span className="text-gray-300">View →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
