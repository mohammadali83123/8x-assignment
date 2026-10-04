import { createClient } from "@/lib/supabase/server";
import { percentOff } from "@/lib/format";
import type { Category, ProductSummary } from "@/types/db";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { ProductRow } from "@/components/home/ProductRow";
import { SignInCard, TileCard, type Tile } from "@/components/home/TileCard";

type PoolProduct = ProductSummary & { category_id: number | null };

const GRADIENTS = [
  "linear-gradient(120deg, #232f3e 0%, #37475a 55%, #febd69 130%)",
  "linear-gradient(120deg, #0f3d3e 0%, #1c7c7d 60%, #9be7d8 130%)",
  "linear-gradient(120deg, #4a1d5c 0%, #8e44ad 60%, #f5b7b1 130%)",
  "linear-gradient(120deg, #7a2e0e 0%, #e67e22 60%, #ffd814 130%)",
];

const ROW_SIZE = 14;

export default async function Home() {
  const supabase = await createClient();
  const [{ data: cats }, { data: pool }] = await Promise.all([
    supabase.from("categories").select("id, slug, name, image_url").order("name"),
    supabase
      .from("products")
      .select("id, title, price, list_price, rating, rating_count, thumbnail, is_prime, category_id")
      .order("rating_count", { ascending: false })
      .limit(400),
  ]);

  const categories = (cats ?? []) as Category[];
  const products = (pool ?? []) as PoolProduct[];

  const byCategory = new Map<number, PoolProduct[]>();
  for (const p of products) {
    if (p.category_id == null) continue;
    byCategory.set(p.category_id, [...(byCategory.get(p.category_id) ?? []), p]);
  }
  const populated = categories
    .filter((c) => byCategory.has(c.id))
    .sort((a, b) => byCategory.get(b.id)!.length - byCategory.get(a.id)!.length);

  const deals = products
    .filter((p) => percentOff(p.price, p.list_price) > 0)
    .sort((a, b) => percentOff(b.price, b.list_price) - percentOff(a.price, a.list_price));
  const topRated = [...products].sort((a, b) => b.rating - a.rating || b.rating_count - a.rating_count);

  const tiles: Tile[] = populated.map((c) => ({
    label: `Shop ${c.name}`,
    href: `/s?cat=${c.slug}`,
    image: c.image_url ?? byCategory.get(c.id)![0].thumbnail,
  }));
  const dealTiles: Tile[] = deals.slice(0, 4).map((p) => ({
    label: `${percentOff(p.price, p.list_price)}% off`,
    href: `/dp/${p.id}`,
    image: p.thumbnail,
  }));

  const slides: HeroSlide[] = populated.slice(0, 4).map((c, i) => ({
    headline: i === 0 ? `Discover ${c.name}` : `Shop ${c.name}`,
    sub: i === 0 ? "Great prices and fast delivery on top picks." : "Handpicked favourites, delivered quickly.",
    cta: `Shop ${c.name}`,
    href: `/s?cat=${c.slug}`,
    gradient: GRADIENTS[i % GRADIENTS.length],
    image: byCategory.get(c.id)![0].thumbnail,
  }));
  if (slides.length === 0) {
    slides.push({
      headline: "Welcome to Amazon Clone",
      sub: "Browse everything we have in store.",
      cta: "Start shopping",
      href: "/s",
      gradient: GRADIENTS[0],
      image: null,
    });
  }

  const categoryRows = populated.filter((c) => byCategory.get(c.id)!.length >= 6).slice(0, 3);

  return (
    <div>
      <HeroCarousel slides={slides} />
      <div className="relative z-10 mx-auto max-w-[1500px] space-y-5 px-4 pb-8 lg:-mt-52">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.length > 0 && (
            <TileCard title="Shop by category" tiles={tiles.slice(0, 4)} linkText="See all categories" linkHref="/s" />
          )}
          {tiles.length > 4 && (
            <TileCard title="More to explore" tiles={tiles.slice(4, 8)} linkText="Explore more" linkHref="/s" />
          )}
          {dealTiles.length > 0 && (
            <TileCard title="Today's deals" tiles={dealTiles} linkText="See all deals" linkHref="/s" />
          )}
          <SignInCard />
        </div>

        <ProductRow title="Today's deals" href="/s" products={deals.slice(0, ROW_SIZE)} />
        <ProductRow title="Top rated" href="/s?sort=rating" products={topRated.slice(0, ROW_SIZE)} />
        {categoryRows.map((c) => (
          <ProductRow
            key={c.id}
            title={`Best in ${c.name}`}
            href={`/s?cat=${c.slug}`}
            products={byCategory.get(c.id)!.slice(0, ROW_SIZE)}
          />
        ))}

        {products.length === 0 && (
          <p className="rounded bg-white p-8 text-center text-[#565959]">No products yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
