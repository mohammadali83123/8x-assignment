"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string } | undefined;

type GuestItem = { product_id: number; qty: number; saved_for_later: boolean };

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
};

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function friendly(message: string) {
  const m = message.toLowerCase();
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

  const supabase = await createClient();
  const { data: current } = await supabase.auth.getUser();
  const options = { data: { full_name: name } };

  let userId: string | undefined;
  if (current.user?.is_anonymous) {
    // Upgrading keeps the same user id, so the guest cart carries over.
    const { data, error } = await supabase.auth.updateUser({ email, password, ...options });
    if (error) return { error: friendly(error.message) };
    userId = data.user.id;
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) return { error: friendly(error.message) };
    if (!data.session) return { error: "An account with this email already exists. Try signing in instead." };
    userId = data.user?.id;
  }

  if (userId) await supabase.from("profiles").upsert({ id: userId, full_name: name });
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
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
  if (error) return { error: friendly(error.message) };

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
