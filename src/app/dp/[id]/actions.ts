"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getOrCreateUser, isGuest } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_QTY = 10;

async function upsertCartItem(productId: number, qty: number): Promise<ActionResult> {
  if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty <= 0) {
    return { ok: false, error: "Invalid request." };
  }
  const { supabase, user } = await getOrCreateUser();
  const { data: product } = await supabase.from("products").select("stock").eq("id", productId).maybeSingle();
  if (!product) return { ok: false, error: "This product no longer exists." };
  const cap = Math.min(MAX_QTY, product.stock);
  if (cap < 1) return { ok: false, error: "This product is currently unavailable." };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("qty")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  const next = Math.min(cap, (existing?.qty ?? 0) + qty);

  const { error } = await supabase
    .from("cart_items")
    .upsert({ user_id: user.id, product_id: productId, qty: next, saved_for_later: false });
  if (error) return { ok: false, error: "Could not add to cart. Please try again." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addToCart(productId: number, qty: number): Promise<ActionResult> {
  return upsertCartItem(productId, qty);
}

export async function buyNow(productId: number, qty: number): Promise<ActionResult> {
  const result = await upsertCartItem(productId, qty);
  if (!result.ok) return result;
  redirect("/checkout");
}

export async function submitReview(productId: number, form: FormData): Promise<ActionResult> {
  const rating = Number(form.get("rating"));
  const title = String(form.get("title") ?? "").trim().slice(0, 150);
  const body = String(form.get("body") ?? "").trim().slice(0, 5000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Please select a star rating." };
  if (!title) return { ok: false, error: "Please add a headline." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || isGuest(user)) return { ok: false, error: "Sign in to write a review." };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const authorName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Amazon Customer";

  const { error } = await supabase
    .from("reviews")
    .upsert(
      { product_id: productId, user_id: user.id, author_name: authorName, rating, title, body },
      { onConflict: "product_id,user_id" },
    );
  if (error) return { ok: false, error: "Could not save your review. Please try again." };
  revalidatePath(`/dp/${productId}`);
  return { ok: true };
}
