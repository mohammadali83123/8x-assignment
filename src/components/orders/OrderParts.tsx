import Link from "next/link";
import type { Order, OrderItem } from "@/types/db";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Pending",
  paid: "Order confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function AddressLines({ address }: { address: Order["address"] }) {
  return (
    <address className="not-italic text-sm leading-snug">
      <b>{address.full_name}</b>
      <br />
      {address.line1}
      {address.line2 && (
        <>
          <br />
          {address.line2}
        </>
      )}
      <br />
      {address.city}, {address.state} {address.zip}
      <br />
      {address.country}
    </address>
  );
}

export function ItemThumb({ item }: { item: Pick<OrderItem, "thumbnail" | "product_id"> }) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#f7f7f7]">
      {item.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}

export function BuyAgain({ productId }: { productId: number | null }) {
  if (productId === null) return null;
  return (
    <Link
      href={`/dp/${productId}`}
      className="mt-2 inline-block rounded-lg border border-[#fcd200] bg-[#ffd814] px-3 py-1 text-sm hover:bg-[#f7ca00]"
    >
      Buy it again
    </Link>
  );
}
