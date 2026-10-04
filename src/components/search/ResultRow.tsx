import Link from "next/link";
import type { ProductSummary } from "@/types/db";
import { Price } from "@/components/product/Price";
import { Stars } from "@/components/product/Stars";

export function ResultRow({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/dp/${product.id}`}
      className="group flex gap-4 border-b border-[#e7e7e7] bg-white p-3 last:border-b-0 hover:bg-[#fafafa]"
    >
      <div className="flex h-36 w-36 shrink-0 items-center justify-center bg-[#f7f7f7] sm:h-48 sm:w-48">
        {product.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="line-clamp-3 text-base text-[#0f1111] group-hover:text-[#c7511f] sm:text-lg">
          {product.title}
        </h2>
        {product.rating > 0 && <Stars rating={product.rating} count={product.rating_count} />}
        <Price price={product.price} listPrice={product.list_price} />
        {product.is_prime && <span className="text-sm font-bold italic text-[#00a8e1]">prime</span>}
        <span className="text-xs text-[#565959]">FREE delivery on orders over $35</span>
      </div>
    </Link>
  );
}
