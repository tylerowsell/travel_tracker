'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Plane, Users, Calendar, MapPin } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface TripInvite {
  id: string;
  trip_id: number;
  expires_at?: string;
  max_uses?: number;
  used_count: number;
}

export default function InvitePage({ params }: { params: { inviteId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invite, setInvite] = useState<TripInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const { data } = await axios.get(`${API_URL}/invites/${params.inviteId}`);
        setInvite(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [params.inviteId]);

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invite/${params.inviteId}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}/invites/${params.inviteId}/accept`,
        {},
        {
          headers: { 'x-user-sub': user.id },
        }
      );

      // Redirect to the trip
      router.push(`/trip/${invite?.trip_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Plane className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">TripThreads</h1>
          </div>
          <p className="text-muted-foreground">You've been invited to join a trip!</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Trip ID</p>
                <p className="font-medium">#{invite?.trip_id}</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                {invite?.used_count} {invite?.used_count === 1 ? 'person has' : 'people have'}{' '}
                already joined using this link
              </p>
              {invite?.max_uses && (
                <p className="text-sm text-muted-foreground">
                  Max uses: {invite.max_uses}
                </p>
              )}
              {invite?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Expires: {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in to accept this invitation
              </p>
              <button
                onClick={() => router.push(`/login?redirect=/invite/${params.inviteId}`)}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In to Join
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push(`/signup?redirect=/invite/${params.inviteId}`)}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {accepting ? 'Joining trip...' : 'Accept Invitation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
