import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductSummary } from "@/types/db";

export const PAGE_SIZE = 24;

export const SORTS = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Avg. Customer Review",
  newest: "Newest Arrivals",
} as const;
export type Sort = keyof typeof SORTS;

export type SearchParams = {
  k: string;
  cat: string;
  sort: Sort;
  page: number;
  min?: number;
  max?: number;
  rating?: number;
  prime: boolean;
};

type Raw = Record<string, string | string[] | undefined>;
type Overrides = Partial<Record<keyof SearchParams, string | number | boolean | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const num = (v: string) => (v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : undefined);

export function parseParams(raw: Raw): SearchParams {
  const sort = first(raw.sort);
  const page = Math.floor(Number(first(raw.page)));
  const rating = num(first(raw.rating));
  return {
    k: first(raw.k).trim(),
    cat: first(raw.cat).trim(),
    sort: sort in SORTS ? (sort as Sort) : "featured",
    page: page >= 1 ? page : 1,
    min: num(first(raw.min)),
    max: num(first(raw.max)),
    rating: rating && rating <= 5 ? rating : undefined,
    prime: first(raw.prime) === "1",
  };
}

/** Build a /s URL from the current params plus overrides. Falsy values are dropped; page resets unless overridden. */
export function buildHref(p: SearchParams, overrides: Overrides = {}) {
  const m: Overrides = { ...p, page: 1, ...overrides };
  const qs = new URLSearchParams();
  if (m.k) qs.set("k", String(m.k));
  if (m.cat) qs.set("cat", String(m.cat));
  if (m.sort && m.sort !== "featured") qs.set("sort", String(m.sort));
  if (m.min !== undefined) qs.set("min", String(m.min));
  if (m.max !== undefined) qs.set("max", String(m.max));
  if (m.rating) qs.set("rating", String(m.rating));
  if (m.prime) qs.set("prime", "1");
  if (Number(m.page) > 1) qs.set("page", String(m.page));
  const s = qs.toString();
  return s ? `/s?${s}` : "/s";
}

/** Overrides that remove every filter but keep keyword and sort. */
export const CLEAR_FILTERS: Overrides = {
  cat: "",
  rating: undefined,
  min: undefined,
  max: undefined,
  prime: false,
};

const SELECT = "id,title,price,list_price,rating,rating_count,thumbnail,is_prime";

function buildQuery(supabase: SupabaseClient, p: SearchParams, mode: "fts" | "ilike") {
  let q = supabase
    .from("products")
    .select(p.cat ? `${SELECT},categories!inner(slug)` : SELECT, { count: "exact" });
  if (p.k) {
    q =
      mode === "fts"
        ? q.textSearch("search", p.k, { type: "websearch", config: "english" })
        : q.ilike("title", `%${p.k.replace(/[%_\\]/g, "\\$&")}%`);
  }
  if (p.cat) q = q.eq("categories.slug", p.cat);
  if (p.min !== undefined) q = q.gte("price", p.min);
  if (p.max !== undefined) q = q.lte("price", p.max);
  if (p.rating) q = q.gte("rating", p.rating);
  if (p.prime) q = q.eq("is_prime", true);

  switch (p.sort) {
    case "price-asc":
      q = q.order("price", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price", { ascending: false });
      break;
    case "rating":
      q = q.order("rating", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("rating_count", { ascending: false });
  }
  const from = (p.page - 1) * PAGE_SIZE;
  return q.order("id").range(from, from + PAGE_SIZE - 1);
}

export async function searchProducts(supabase: SupabaseClient, p: SearchParams) {
  let res = await buildQuery(supabase, p, "fts");
  if (p.k && !res.error && (res.count ?? 0) === 0) res = await buildQuery(supabase, p, "ilike");
  return {
    products: (res.data ?? []) as unknown as ProductSummary[],
    count: res.count ?? 0,
    // PGRST103: page beyond the last one, shown as empty results
    error: res.error && res.error.code !== "PGRST103" ? res.error.message : null,
  };
}
