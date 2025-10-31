'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle events
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN') {
        // Sync user profile with backend
        await syncUserProfile(session?.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Sync user profile with backend
async function syncUserProfile(user: User | null | undefined) {
  if (!user) return;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        'x-user-sub': user.id,
      },
    });

    // If user profile doesn't exist, create it
    if (response.status === 404) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-sub': user.id,
        },
        body: JSON.stringify({
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
        }),
      });
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
  }
}
