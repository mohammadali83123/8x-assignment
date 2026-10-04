"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mergeGuestCart, readGuestCart } from "@/lib/cart-merge";

/** `sent`: a confirmation email was sent to this address. `unconfirmed`: sign-in blocked until the email is confirmed. */
export type AuthState = { error?: string; sent?: string; unconfirmed?: string } | undefined;

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
  if (m.includes("security purposes") || m.includes("only request this"))
    return "A confirmation email was just sent. Please wait a minute before requesting another.";
  if (m.includes("rate limit")) return "We can't send more emails right now. Please try again in a little while.";
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
  const guestCart = await readGuestCart(supabase);
  const options = { data: { full_name: name }, emailRedirectTo: await callbackUrl(next) };

  // A brand-new account (not an in-place guest upgrade): Supabase won't let an unconfirmed
  // guest set a password. The guest's cart is merged in once the account is usable.
  const { data, error } = await supabase.auth.signUp({ email, password, options });
  if (error) return { error: friendly(error.message) };
  // Supabase hides duplicates behind an empty identities list.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists. Try signing in instead." };
  }
  // "Confirm email" is on: no session until the emailed link is clicked.
  if (!data.session || !data.user) return { sent: email };

  await supabase.from("profiles").upsert({ id: data.user.id, full_name: name });
  await mergeGuestCart(guestCart, data.user.id);
  revalidatePath("/", "layout");
  redirect(next);
}

/** Send the confirmation email again. */
export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const emailRedirectTo = await callbackUrl(safeNext(formData.get("next")));
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } });
  if (error) return { error: friendly(error.message) };
  return { sent: email };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const guestCart = await readGuestCart(supabase);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const unconfirmed = error.message.toLowerCase().includes("not confirmed");
    return { error: friendly(error.message), unconfirmed: unconfirmed ? email : undefined };
  }

  await mergeGuestCart(guestCart, data.user.id);
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}
