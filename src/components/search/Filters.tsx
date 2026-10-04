import Link from "next/link";
import type { Category } from "@/types/db";
import { Stars } from "@/components/product/Stars";
import { buildHref, type SearchParams } from "./query";

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Under $25", max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#e7e7e7] py-3 first:pt-0">
      <h3 className="mb-1 text-sm font-bold text-[#0f1111]">{title}</h3>
      {children}
    </section>
  );
}

const linkCls = "block py-0.5 text-sm text-[#0f1111] hover:text-[#c7511f]";
const inputCls = "w-16 rounded border border-[#888c8c] px-1.5 py-1 text-sm";

export function Filters({ p, categories }: { p: SearchParams; categories: Category[] }) {
  return (
    <aside className="w-full shrink-0 md:w-56">
      <Section title="Department">
        {p.cat && (
          <Link href={buildHref(p, { cat: "" })} className={`${linkCls} text-[#007185]`}>
            ‹ Any Department
          </Link>
        )}
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref(p, { cat: c.slug })}
            className={`${linkCls} ${p.cat === c.slug ? "font-bold" : ""}`}
          >
            {c.name}
          </Link>
        ))}
      </Section>

      <Section title="Customer Reviews">
        {[4, 3, 2, 1].map((r) => (
          <Link
            key={r}
            href={buildHref(p, { rating: p.rating === r ? undefined : r })}
            className={`flex items-center gap-1 py-0.5 text-sm hover:text-[#c7511f] ${p.rating === r ? "font-bold" : ""}`}
          >
            <Stars rating={r} size={16} /> &amp; Up
          </Link>
        ))}
      </Section>

      <Section title="Price">
        {PRICE_RANGES.map((r) => {
          const active = p.min === r.min && p.max === r.max;
          return (
            <Link
              key={r.label}
              href={buildHref(p, active ? { min: undefined, max: undefined } : { min: r.min, max: r.max })}
              className={`${linkCls} ${active ? "font-bold" : ""}`}
            >
              {r.label}
            </Link>
          );
        })}
        <form action="/s" className="mt-2 flex items-center gap-1">
          {p.k && <input type="hidden" name="k" value={p.k} />}
          {p.cat && <input type="hidden" name="cat" value={p.cat} />}
          {p.sort !== "featured" && <input type="hidden" name="sort" value={p.sort} />}
          {p.rating && <input type="hidden" name="rating" value={p.rating} />}
          {p.prime && <input type="hidden" name="prime" value="1" />}
          <input name="min" type="number" min="0" placeholder="$ Min" defaultValue={p.min} className={inputCls} />
          <input name="max" type="number" min="0" placeholder="$ Max" defaultValue={p.max} className={inputCls} />
          <button className="rounded-lg border border-[#d5d9d9] bg-white px-2 py-1 text-sm shadow-sm hover:bg-[#f7fafa]">
            Go
          </button>
        </form>
      </Section>

      <Section title="Delivery">
        <Link
          href={buildHref(p, { prime: !p.prime })}
          className="flex items-center gap-2 py-0.5 text-sm hover:text-[#c7511f]"
        >
          <span
            className={`inline-flex size-4 items-center justify-center rounded-sm border text-xs ${p.prime ? "border-[#007185] bg-[#007185] text-white" : "border-[#888c8c] bg-white"}`}
            aria-hidden
          >
            {p.prime && "✓"}
          </span>
          <span className="font-bold italic text-[#00a8e1]">prime</span>
        </Link>
      </Section>
    </aside>
  );
}
