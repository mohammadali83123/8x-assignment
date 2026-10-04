import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type GuestItem = { product_id: number; qty: number; saved_for_later: boolean };
export type GuestCart = { guestId: string; items: GuestItem[] } | null;

/** The current guest's cart, or null if the visitor isn't an anonymous guest. Read it BEFORE the session changes. */
export async function readGuestCart(supabase: SupabaseClient): Promise<GuestCart> {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.is_anonymous) return null;
  const { data: items } = await supabase.from("cart_items").select("product_id, qty, saved_for_later");
  return { guestId: data.user.id, items: items ?? [] };
}

/** Best effort: move the guest's cart into the account's cart. Never throws, so it can't block sign-in. */
export async function mergeGuestCart(cart: GuestCart, accountId: string) {
  if (!cart || !cart.items.length || cart.guestId === accountId) return;
  try {
    const admin = createAdminClient();
    const { data: existing } = await admin.from("cart_items").select("product_id, qty").eq("user_id", accountId);
    const owned = new Map((existing ?? []).map((r) => [r.product_id, r.qty]));
    await admin.from("cart_items").upsert(
      cart.items.map((i) => ({
        user_id: accountId,
        product_id: i.product_id,
        qty: i.qty + (owned.get(i.product_id) ?? 0),
        saved_for_later: i.saved_for_later,
      })),
    );
    await admin.from("cart_items").delete().eq("user_id", cart.guestId);
  } catch {
    // The guest keeps their old cart rows; nothing is lost.
  }
}
