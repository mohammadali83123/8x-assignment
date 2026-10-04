import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/db";
import { Filters } from "@/components/search/Filters";
import { Pagination } from "@/components/search/Pagination";
import { ResultRow } from "@/components/search/ResultRow";
import { SortSelect } from "@/components/search/SortSelect";
import {
  CLEAR_FILTERS,
  PAGE_SIZE,
  SORTS,
  buildHref,
  parseParams,
  searchProducts,
  type Sort,
} from "@/components/search/query";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { k } = parseParams(await searchParams);
  return { title: k ? `Amazon Clone: ${k}` : "Amazon Clone: All Products" };
}

export default async function SearchPage({ searchParams }: Props) {
  const p = parseParams(await searchParams);
  const supabase = await createClient();
  const [{ products, count, error }, { data: cats }] = await Promise.all([
    searchProducts(supabase, p),
    supabase.from("categories").select("*").order("name"),
  ]);
  const categories = (cats ?? []) as Category[];
  const catName = categories.find((c) => c.slug === p.cat)?.name;

  const pages = Math.ceil(count / PAGE_SIZE);
  const from = (p.page - 1) * PAGE_SIZE + 1;
  const to = from + products.length - 1;

  const chips = [
    p.cat && { label: catName ?? p.cat, href: buildHref(p, { cat: "" }) },
    p.rating && { label: `${p.rating} stars & up`, href: buildHref(p, { rating: undefined }) },
    (p.min !== undefined || p.max !== undefined) && {
      label: p.max === undefined ? `$${p.min}+` : `$${p.min ?? 0} - $${p.max}`,
      href: buildHref(p, { min: undefined, max: undefined }),
    },
    p.prime && { label: "Prime", href: buildHref(p, { prime: false }) },
  ].filter(Boolean) as { label: string; href: string }[];
  const clearAll = buildHref(p, CLEAR_FILTERS);

  const sortHrefs = Object.fromEntries(
    Object.keys(SORTS).map((s) => [s, buildHref(p, { sort: s })]),
  ) as Record<Sort, string>;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 bg-white p-4 md:flex-row">
      <Filters p={p} categories={categories} />

      <section className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e7e7] pb-2">
          <p className="text-sm text-[#0f1111]">
            {products.length > 0
              ? `${from}-${to} of ${count.toLocaleString("en-US")} results`
              : "No results"}
            {p.k && (
              <>
                {" for "}
                <span className="font-bold text-[#c45500]">&quot;{p.k}&quot;</span>
              </>
            )}
          </p>
          <SortSelect value={p.sort} hrefs={sortHrefs} />
        </div>

        {chips.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="inline-flex items-center gap-1 rounded-full border border-[#d5d9d9] bg-[#f0f2f2] px-3 py-1 text-xs hover:bg-[#e3e6e6]"
              >
                {c.label} <span aria-label="Remove filter">✕</span>
              </Link>
            ))}
            <Link href={clearAll} className="text-xs text-[#007185] hover:underline">
              Clear all
            </Link>
          </div>
        )}

        {error ? (
          <p className="py-10 text-center text-[#b12704]">Something went wrong loading results. Please try again.</p>
        ) : products.length === 0 ? (
          <div className="py-10">
            <h1 className="text-xl font-bold">{p.k ? `No results for "${p.k}"` : "No products found"}</h1>
            <ul className="mt-3 list-disc pl-5 text-sm text-[#0f1111]">
              <li>Check your spelling or try more general keywords</li>
              <li>Remove some filters to broaden your search</li>
            </ul>
            <div className="mt-4 flex gap-4 text-sm text-[#007185]">
              {chips.length > 0 && (
                <Link href={clearAll} className="hover:underline">
                  Clear all filters
                </Link>
              )}
              <Link href="/s" className="hover:underline">
                Browse all products
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="sr-only">Search results</h1>
            <div className="rounded border border-[#e7e7e7]">
              {products.map((prod) => (
                <ResultRow key={prod.id} product={prod} />
              ))}
            </div>
            <Pagination p={p} pages={pages} />
          </>
        )}
      </section>
    </div>
  );
}
