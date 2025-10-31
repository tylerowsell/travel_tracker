import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For use in Client Components with Next.js 14 App Router
export function createSupabaseClient() {
  return createClientComponentClient();
}

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Helper to get session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}
