import Link from "next/link";
import { Price } from "@/components/product/Price";
import type { CartItem, Product } from "@/types/db";
import { CartItemActions } from "./CartItemActions";

export type CartLine = Pick<CartItem, "qty" | "saved_for_later"> & {
  product: Pick<Product, "id" | "title" | "price" | "list_price" | "stock" | "thumbnail" | "is_prime">;
};

export function CartRow({ line, saved = false }: { line: CartLine; saved?: boolean }) {
  const { product, qty } = line;
  const inStock = product.stock > 0;
  return (
    <li className="flex gap-4 border-b border-[#ddd] py-4 last:border-b-0">
      <Link href={`/dp/${product.id}`} className="relative h-28 w-28 shrink-0 sm:h-44 sm:w-44">
        {product.thumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain" />
          </>
        ) : (
          <div className="h-full w-full bg-[#f0f2f2]" />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-4">
          <Link href={`/dp/${product.id}`} className="line-clamp-2 text-base font-medium hover:text-[#c7511f]">
            {product.title}
          </Link>
          <div className="shrink-0 text-right">
            <Price price={product.price} />
          </div>
        </div>
        <p className={`mt-1 text-xs ${inStock ? "text-[#007600]" : "text-[#b12704]"}`}>
          {!inStock ? "Currently unavailable" : product.stock <= 5 ? `Only ${product.stock} left in stock` : "In Stock"}
        </p>
        {product.is_prime && (
          <p className="mt-1 text-xs font-bold italic text-[#00a8e1]">
            prime <span className="font-normal not-italic text-[#565959]">FREE delivery</span>
          </p>
        )}
        <CartItemActions productId={product.id} qty={qty} maxQty={Math.min(product.stock, 30)} saved={saved} />
      </div>
    </li>
  );
}
