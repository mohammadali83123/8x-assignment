import type { SupabaseClient } from "@supabase/supabase-js";

export type CheckoutItem = {
  product_id: number;
  title: string;
  price: number;
  thumbnail: string | null;
  stock: number;
  qty: number;
};

type ProductRow = { id: number; title: string; price: number; thumbnail: string | null; stock: number };

/** Active (not saved-for-later) cart lines with current product data. */
export async function getCheckoutItems(supabase: SupabaseClient, userId: string): Promise<CheckoutItem[]> {
  const { data } = await supabase
    .from("cart_items")
    .select("qty, products(id, title, price, thumbnail, stock)")
    .eq("user_id", userId)
    .eq("saved_for_later", false)
    .order("created_at");
  return (data ?? []).flatMap((row) => {
    const p = (Array.isArray(row.products) ? row.products[0] : row.products) as ProductRow | null;
    if (!p) return [];
    return [{ product_id: p.id, title: p.title, price: Number(p.price), thumbnail: p.thumbnail, stock: p.stock, qty: row.qty }];
  });
}
