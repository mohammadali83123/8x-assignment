"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutItems } from "@/components/checkout/cart";
import { computeTotals } from "@/components/checkout/totals";
import type { Address } from "@/types/db";

export type AddressInput = {
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_default: boolean;
};

export async function addAddress(input: AddressInput): Promise<{ address: Address } | { error: string }> {
  const user = await getUser();
  if (!user || isGuest(user)) return { error: "Please sign in to save an address." };
  const clean = {
    full_name: input.full_name.trim(),
    line1: input.line1.trim(),
    line2: input.line2.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    phone: input.phone.trim() || null,
  };
  if (!clean.full_name || !clean.line1 || !clean.city || !clean.state || !clean.zip) {
    return { error: "Please fill in all required address fields." };
  }
  const supabase = await createClient();
  if (input.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...clean, user_id: user.id, is_default: input.is_default })
    .select()
    .single();
  if (error || !data) return { error: "Could not save the address. Please try again." };
  return { address: data as Address };
}

/** Mock payment: card details are validated client-side and never reach the server. */
export async function placeOrder(addressId: string): Promise<{ error: string }> {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/checkout");
  const supabase = await createClient();

  const [items, { data: addr }] = await Promise.all([
    getCheckoutItems(supabase, user.id),
    supabase.from("addresses").select("*").eq("id", addressId).maybeSingle(),
  ]);
  if (items.length === 0) redirect("/cart");
  if (!addr) return { error: "Please select a delivery address." };
  const short = items.find((i) => i.stock < i.qty);
  if (short) {
    return { error: `Only ${short.stock} of "${short.title}" left in stock. Please update your cart.` };
  }

  const a = addr as Address;
  const snapshot = {
    full_name: a.full_name,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    phone: a.phone,
  };
  const { data: order, error } = await supabase
    .from("orders")
    .insert({ user_id: user.id, status: "paid", ...computeTotals(items), address: snapshot })
    .select("id")
    .single();
  if (error || !order) return { error: "We couldn't place your order. Please try again." };

  const admin = createAdminClient();
  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      title: i.title,
      price: i.price,
      qty: i.qty,
      thumbnail: i.thumbnail,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "We couldn't place your order. Please try again." };
  }

  await Promise.all(
    items.map((i) =>
      admin.from("products").update({ stock: i.stock - i.qty }).eq("id", i.product_id).eq("stock", i.stock),
    ),
  );
  await supabase.from("cart_items").delete().eq("user_id", user.id).eq("saved_for_later", false);

  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}?placed=1`);
}
