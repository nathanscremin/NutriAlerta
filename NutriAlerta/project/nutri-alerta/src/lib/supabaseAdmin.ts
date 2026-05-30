import { createClient } from '@supabase/supabase-js';

/**
 * Isolated thread-safe authenticated admin client to bypass RLS in the cloud database.
 * Centralized from api/data/route.ts and api/pacientes/route.ts (DUP-4).
 */
export async function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL;
  const adminPassword = process.env.SUPABASE_ADMIN_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in environment variables.');
  }

  if (!adminEmail || !adminPassword) {
    throw new Error('Supabase admin authentication failed: SUPABASE_ADMIN_EMAIL and SUPABASE_ADMIN_PASSWORD must be defined in environment variables.');
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (error) {
    throw new Error(`Auth RLS bypass failed: ${error.message}`);
  }

  return client;
}
