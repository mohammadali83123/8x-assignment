import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

/** The current user (real or anonymous), or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * The current user, creating an anonymous guest session if there is none.
 * Only call from Server Actions / Route Handlers (they can write cookies).
 * Guests get a real `auth.uid()`, so cart rows and RLS work before sign-up.
 */
export async function getOrCreateUser(
  supabase?: SupabaseClient,
): Promise<{ supabase: SupabaseClient; user: User }> {
  const client = supabase ?? (await createClient());
  const { data } = await client.auth.getUser();
  if (data.user) return { supabase: client, user: data.user };
  const { data: anon, error } = await client.auth.signInAnonymously();
  if (error || !anon.user) throw new Error(error?.message ?? "Could not start guest session");
  return { supabase: client, user: anon.user };
}

export const isGuest = (user: User | null) => !user || user.is_anonymous === true;
