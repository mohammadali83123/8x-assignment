import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { getCheckoutItems } from "@/components/checkout/cart";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import type { Address } from "@/types/db";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/checkout");
  const supabase = await createClient();
  const [items, { data: addresses }] = await Promise.all([
    getCheckoutItems(supabase, user.id),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (items.length === 0) redirect("/cart");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <h1 className="mb-4 text-2xl font-normal">Checkout</h1>
      <CheckoutForm items={items} addresses={(addresses ?? []) as Address[]} />
    </div>
  );
}
