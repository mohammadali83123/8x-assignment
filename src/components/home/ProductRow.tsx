import Link from "next/link";
import type { ProductSummary } from "@/types/db";
import { ProductCard } from "@/components/product/ProductCard";

export function ProductRow({
  title,
  seeMore,
  href,
  products,
}: {
  title: string;
  seeMore: string;
  href: string;
  products: ProductSummary[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="rounded bg-white p-5">
      <div className="mb-3 flex items-baseline gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={href} className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
          {seeMore}
        </Link>
      </div>
      <div className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-48 shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
