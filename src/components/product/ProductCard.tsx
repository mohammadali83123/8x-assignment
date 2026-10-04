import Link from "next/link";
import type { ProductSummary } from "@/types/db";
import { Price } from "./Price";
import { Stars } from "./Stars";

/** Shared product tile. Links to /dp/[id]. Used by home, search and related-items rows. */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/dp/${product.id}`}
      className="group flex h-full flex-col gap-2 rounded bg-white p-3 hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center bg-[#f7f7f7]">
        {product.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
        )}
      </div>
      <h3 className="line-clamp-2 text-sm text-[#0f1111] group-hover:text-[#c7511f]">{product.title}</h3>
      {product.rating > 0 && <Stars rating={product.rating} count={product.rating_count} />}
      <Price price={product.price} listPrice={product.list_price} />
      {product.is_prime && <span className="text-xs font-bold italic text-[#00a8e1]">prime</span>}
    </Link>
  );
}
