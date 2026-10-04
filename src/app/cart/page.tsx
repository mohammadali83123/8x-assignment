import Link from "next/link";
import { CartRow, type CartLine } from "@/components/cart/CartRow";
import { computeTotals } from "@/components/cart/totals";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shopping Cart" };

const plural = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

async function loadCart(): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data } = await supabase
    .from("cart_items")
    .select("qty, saved_for_later, created_at, product:products(id, title, price, list_price, stock, thumbnail, is_prime)")
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as (CartLine | { product: null })[]).filter(
    (l): l is CartLine => l.product !== null,
  );
}

export default async function CartPage() {
  const lines = await loadCart();
  const active = lines.filter((l) => !l.saved_for_later);
  const saved = lines.filter((l) => l.saved_for_later);
  const count = active.reduce((n, l) => n + l.qty, 0);
  const { subtotal } = computeTotals(active.map((l) => ({ price: l.product.price, qty: l.qty })));
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="bg-white p-5">
            {active.length === 0 ? (
              <div>
                <h1 className="text-2xl font-medium">Your Amazon Cart is empty</h1>
                <p className="mt-2 text-sm">
                  Your shopping cart is waiting. Give it purpose, fill it with groceries, clothing, household supplies,
                  electronics and more.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link href="/signin" className="rounded-lg bg-[#ffd814] px-4 py-1.5 hover:bg-[#f7ca00]">
                    Sign in to your account
                  </Link>
                  <Link href="/" className="rounded-lg border border-[#d5d9d9] px-4 py-1.5 hover:bg-[#f7fafa]">
                    Continue shopping
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between border-b border-[#ddd] pb-2">
                  <h1 className="text-[28px] font-medium">Shopping Cart</h1>
                  <span className="hidden text-sm text-[#565959] sm:block">Price</span>
                </div>
                <ul>
                  {active.map((l) => (
                    <CartRow key={l.product.id} line={l} />
                  ))}
                </ul>
                <p className="border-t border-[#ddd] pt-3 text-right text-lg">
                  Subtotal ({plural(count)}): <strong>{formatPrice(subtotal)}</strong>
                </p>
              </>
            )}
          </section>

          {saved.length > 0 && (
            <section className="bg-white p-5">
              <h2 className="border-b border-[#ddd] pb-2 text-xl font-medium">
                Saved for later ({plural(saved.reduce((n, l) => n + l.qty, 0))})
              </h2>
              <ul>
                {saved.map((l) => (
                  <CartRow key={l.product.id} line={l} saved />
                ))}
              </ul>
            </section>
          )}
        </div>

        {active.length > 0 && (
          <aside className="h-fit space-y-3 bg-white p-5">
            <p className={`text-sm ${remaining > 0 ? "text-[#565959]" : "text-[#007600]"}`}>
              {remaining > 0
                ? `Add ${formatPrice(remaining)} of eligible items to your order to qualify for FREE Shipping.`
                : "Your order qualifies for FREE Shipping."}
            </p>
            <p className="text-lg">
              Subtotal ({plural(count)}): <strong>{formatPrice(subtotal)}</strong>
            </p>
            <Link
              href="/checkout"
              className="block rounded-full bg-[#ffd814] py-2 text-center text-sm shadow-sm hover:bg-[#f7ca00]"
            >
              Proceed to checkout
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
