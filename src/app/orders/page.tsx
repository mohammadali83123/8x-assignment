import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { BuyAgain, formatDate, ItemThumb, STATUS_LABEL } from "@/components/orders/OrderParts";
import type { Order, OrderItem } from "@/types/db";

export const metadata: Metadata = { title: "Your Orders" };

export default async function OrdersPage() {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/orders");
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .order("id", { referencedTable: "order_items" });
  const orders = (data ?? []) as (Order & { order_items: OrderItem[] })[];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      <h1 className="mb-4 text-3xl font-normal">Your Orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-[#d5d9d9] bg-white p-8 text-center">
          <p className="mb-3">You have not placed any orders yet.</p>
          <Link href="/" className="text-[#007185] hover:text-[#c7511f] hover:underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-white">
              <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-2 border-b border-[#d5d9d9] bg-[#f0f2f2] px-4 py-3 text-xs text-[#565959]">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <p className="uppercase">Order placed</p>
                    <p className="text-sm text-[#0f1111]">{formatDate(o.created_at)}</p>
                  </div>
                  <div>
                    <p className="uppercase">Total</p>
                    <p className="text-sm text-[#0f1111]">{formatPrice(Number(o.total))}</p>
                  </div>
                  <div>
                    <p className="uppercase">Ship to</p>
                    <p className="text-sm text-[#007185]">{o.address.full_name}</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="uppercase">Order # {o.id}</p>
                  <Link href={`/orders/${o.id}`} className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
                    View order details
                  </Link>
                </div>
              </header>
              <div className="p-4">
                <h2 className="mb-3 text-lg font-bold">{STATUS_LABEL[o.status]}</h2>
                <ul className="space-y-4">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex gap-4">
                      <ItemThumb item={i} />
                      <div className="text-sm">
                        {i.product_id ? (
                          <Link href={`/dp/${i.product_id}`} className="line-clamp-2 text-[#007185] hover:text-[#c7511f] hover:underline">
                            {i.title}
                          </Link>
                        ) : (
                          <p className="line-clamp-2">{i.title}</p>
                        )}
                        <p className="text-[#565959]">Qty: {i.qty}</p>
                        <BuyAgain productId={i.product_id} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
