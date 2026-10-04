import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { AddressLines, BuyAgain, formatDate, ItemThumb, STATUS_LABEL } from "@/components/orders/OrderParts";
import type { Order, OrderItem } from "@/types/db";

export const metadata: Metadata = { title: "Order Details" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const user = await getUser();
  if (!user || isGuest(user)) redirect(`/signin?next=/orders/${id}`);
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .order("id", { referencedTable: "order_items" })
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & { order_items: OrderItem[] };

  const rows: [string, string][] = [
    ["Item(s) subtotal:", formatPrice(Number(order.subtotal))],
    ["Shipping:", Number(order.shipping) === 0 ? "FREE" : formatPrice(Number(order.shipping))],
    ["Estimated tax:", formatPrice(Number(order.tax))],
  ];

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6">
      {placed === "1" && (
        <div className="mb-4 rounded-lg border border-[#067d62] bg-[#f0fff8] p-4">
          <h2 className="text-lg font-bold text-[#067d62]">Thank you, your order has been placed.</h2>
          <p className="text-sm">A confirmation will be on its way. You can track this order below.</p>
        </div>
      )}
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-normal">Order Details</h1>
        <Link href="/orders" className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
          Back to your orders
        </Link>
      </div>
      <p className="mb-3 text-sm text-[#565959]">
        Ordered on {formatDate(order.created_at)} · Order # {order.id}
      </p>

      <div className="overflow-hidden rounded-lg border border-[#d5d9d9] bg-white">
        <div className="grid gap-4 border-b border-[#d5d9d9] p-4 sm:grid-cols-3">
          <div>
            <h3 className="mb-1 font-bold">Shipping address</h3>
            <AddressLines address={order.address} />
          </div>
          <div>
            <h3 className="mb-1 font-bold">Status</h3>
            <p className="text-sm">{STATUS_LABEL[order.status]}</p>
          </div>
          <div>
            <h3 className="mb-1 font-bold">Order summary</h3>
            <dl className="space-y-0.5 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-2 font-bold">
                <dt>Grand total:</dt>
                <dd>{formatPrice(Number(order.total))}</dd>
              </div>
            </dl>
          </div>
        </div>
        <ul className="divide-y divide-[#e7e7e7] p-4">
          {order.order_items.map((i) => (
            <li key={i.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <ItemThumb item={i} />
              <div className="text-sm">
                {i.product_id ? (
                  <Link href={`/dp/${i.product_id}`} className="line-clamp-2 text-[#007185] hover:text-[#c7511f] hover:underline">
                    {i.title}
                  </Link>
                ) : (
                  <p className="line-clamp-2">{i.title}</p>
                )}
                <p className="text-[#b12704]">{formatPrice(Number(i.price))}</p>
                <p className="text-[#565959]">Qty: {i.qty}</p>
                <BuyAgain productId={i.product_id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
