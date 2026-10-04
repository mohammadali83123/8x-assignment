"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_QTY = 30;

async function context() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

function refresh() {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

const validId = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0;

export async function removeItem(productId: number) {
  if (!validId(productId)) return;
  const ctx = await context();
  if (!ctx) return;
  await ctx.supabase.from("cart_items").delete().eq("user_id", ctx.userId).eq("product_id", productId);
  refresh();
}

export async function updateQty(productId: number, qty: number) {
  if (!validId(productId) || !Number.isInteger(qty) || qty < 0) return;
  if (qty === 0) return removeItem(productId);
  const ctx = await context();
  if (!ctx) return;
  const { data: product } = await ctx.supabase.from("products").select("stock").eq("id", productId).single();
  if (!product) return;
  const capped = Math.min(qty, MAX_QTY, product.stock);
  if (capped < 1) return;
  await ctx.supabase
    .from("cart_items")
    .update({ qty: capped })
    .eq("user_id", ctx.userId)
    .eq("product_id", productId);
  refresh();
}

async function setSaved(productId: number, saved: boolean) {
  if (!validId(productId)) return;
  const ctx = await context();
  if (!ctx) return;
  await ctx.supabase
    .from("cart_items")
    .update({ saved_for_later: saved })
    .eq("user_id", ctx.userId)
    .eq("product_id", productId);
  refresh();
}

export async function saveForLater(productId: number) {
  await setSaved(productId, true);
}

export async function moveToCart(productId: number) {
  await setSaved(productId, false);
}
