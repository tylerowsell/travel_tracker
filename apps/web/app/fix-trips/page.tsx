'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FixTripsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFixOwnership = async () => {
    if (!user) {
      setResult({
        success: false,
        message: 'You must be logged in to fix trip ownership.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/trips/fix-ownership`,
        {},
        {
          headers: { 'x-user-sub': user.id },
        }
      );

      setResult({
        success: true,
        message: data.message,
      });

      // Refresh after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.detail || 'Failed to fix trip ownership. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            Please log in to fix your trip ownership.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Fix Trip Ownership</h1>
          <p className="text-muted-foreground">
            This will transfer ownership of any trips created with the development user ID to your account.
          </p>
        </div>

        {result && (
          <div
            className={`p-4 rounded-lg border mb-4 ${
              result.success
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.message}
              </p>
            </div>
            {result.success && (
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to home page...
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleFixOwnership}
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Fixing...
              </span>
            ) : (
              'Fix My Trips'
            )}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 p-4 bg-accent/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This is a one-time fix for trips that were created during
            development. If you don't have any old trips to fix, you can skip this and create new
            trips normally.
          </p>
        </div>
      </div>
    </div>
  );
}
