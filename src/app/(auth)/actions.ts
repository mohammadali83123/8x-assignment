"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** `sent`: a confirmation email was sent to this address. `unconfirmed`: sign-in blocked until the email is confirmed. */
export type AuthState = { error?: string; sent?: string; unconfirmed?: string } | undefined;

type GuestItem = { product_id: number; qty: number; saved_for_later: boolean };

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
};

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/** Where Supabase's confirmation link sends the user back to. */
async function callbackUrl(next: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("not confirmed")) return "Please confirm your email address first. Check your inbox for the link.";
  if (m.includes("invalid login")) return "Your email or password is incorrect.";
  if (m.includes("already") && (m.includes("registered") || m.includes("exists")))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("password")) return "Password is too weak. Use at least 6 characters.";
  if (m.includes("rate limit")) return "Too many attempts. Please try again in a moment.";
  if (m.includes("email")) return "Please enter a valid email address.";
  return message;
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Enter your name." };
  if (!email) return { error: "Enter your email." };
  if (password.length < 6) return { error: "Passwords must be at least 6 characters." };
  if (password !== formData.get("confirm")) return { error: "Passwords must match." };

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data: current } = await supabase.auth.getUser();
  const options = { data: { full_name: name }, emailRedirectTo: await callbackUrl(next) };

  if (current.user?.is_anonymous) {
    // Upgrading keeps the same user id, so the guest cart carries over.
    const { data, error } = await supabase.auth.updateUser({ email, password, data: options.data }, { emailRedirectTo: options.emailRedirectTo });
    if (error) return { error: friendly(error.message) };
    // With "Confirm email" on, the user stays a guest until they click the link.
    if (data.user.is_anonymous) return { sent: email };
    await supabase.from("profiles").upsert({ id: data.user.id, full_name: name });
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) return { error: friendly(error.message) };
    // Supabase hides duplicates behind an empty identities list.
    if (data.user && data.user.identities?.length === 0) {
      return { error: "An account with this email already exists. Try signing in instead." };
    }
    if (!data.session) return { sent: email };
    if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, full_name: name });
  }

  revalidatePath("/", "layout");
  redirect(next);
}

/** Send the confirmation email again (for a pending guest upgrade or a fresh sign-up). */
export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const { data: current } = await supabase.auth.getUser();
  const emailRedirectTo = await callbackUrl(safeNext(formData.get("next")));
  const { error } = current.user?.is_anonymous
    ? await supabase.auth.updateUser({ email }, { emailRedirectTo })
    : await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } });
  if (error) return { error: friendly(error.message) };
  return { sent: email };
}

/** Best effort: move the guest's cart into the account's cart. */
async function mergeGuestCart(guestId: string, guestItems: GuestItem[], accountId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("cart_items").select("product_id, qty").eq("user_id", accountId);
  const owned = new Map((existing ?? []).map((r) => [r.product_id, r.qty]));
  const rows = guestItems.map((i) => ({
    user_id: accountId,
    product_id: i.product_id,
    qty: i.qty + (owned.get(i.product_id) ?? 0),
    saved_for_later: i.saved_for_later,
  }));
  await admin.from("cart_items").upsert(rows);
  await admin.from("cart_items").delete().eq("user_id", guestId);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data: current } = await supabase.auth.getUser();
  const guestId = current.user?.is_anonymous ? current.user.id : null;
  let guestItems: GuestItem[] = [];
  if (guestId) {
    const { data } = await supabase.from("cart_items").select("product_id, qty, saved_for_later");
    guestItems = data ?? [];
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const unconfirmed = error.message.toLowerCase().includes("not confirmed");
    return { error: friendly(error.message), unconfirmed: unconfirmed ? email : undefined };
  }

  if (guestId && guestItems.length && data.user.id !== guestId) {
    try {
      await mergeGuestCart(guestId, guestItems, data.user.id);
    } catch {
      // Never block sign-in on a merge failure.
    }
  }
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}
