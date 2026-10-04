import { createClient } from "@/lib/supabase/server";
import { percentOff } from "@/lib/format";
import { getLang, t } from "@/lib/i18n";
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
  const lang = await getLang();
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
    label: t(lang, "shopCat", { name: c.name }),
    href: `/s?cat=${c.slug}`,
    image: c.image_url ?? byCategory.get(c.id)![0].thumbnail,
  }));
  const dealTiles: Tile[] = deals.slice(0, 4).map((p) => ({
    label: t(lang, "pctOff", { pct: percentOff(p.price, p.list_price) }),
    href: `/dp/${p.id}`,
    image: p.thumbnail,
  }));

  const slides: HeroSlide[] = populated.slice(0, 4).map((c, i) => ({
    headline: t(lang, i === 0 ? "discoverCat" : "shopCat", { name: c.name }),
    sub: t(lang, i === 0 ? "heroSub1" : "heroSub2"),
    cta: t(lang, "shopCat", { name: c.name }),
    href: `/s?cat=${c.slug}`,
    gradient: GRADIENTS[i % GRADIENTS.length],
    image: byCategory.get(c.id)![0].thumbnail,
  }));
  if (slides.length === 0) {
    slides.push({
      headline: t(lang, "welcome"),
      sub: t(lang, "welcomeSub"),
      cta: t(lang, "startShopping"),
      href: "/s",
      gradient: GRADIENTS[0],
      image: null,
    });
  }

  const categoryRows = populated.filter((c) => byCategory.get(c.id)!.length >= 6).slice(0, 3);

  return (
    <div>
      <HeroCarousel
        slides={slides}
        labels={{ prev: t(lang, "prevSlide"), next: t(lang, "nextSlide"), goTo: t(lang, "goToSlide", { n: "{n}" }) }}
      />
      <div className="relative z-10 mx-auto max-w-[1500px] space-y-5 px-4 pb-8 lg:-mt-52">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.length > 0 && (
            <TileCard title={t(lang, "shopByCategory")} tiles={tiles.slice(0, 4)} linkText={t(lang, "seeAllCategories")} linkHref="/s" />
          )}
          {tiles.length > 4 && (
            <TileCard title={t(lang, "moreToExplore")} tiles={tiles.slice(4, 8)} linkText={t(lang, "exploreMore")} linkHref="/s" />
          )}
          {dealTiles.length > 0 && (
            <TileCard title={t(lang, "todaysDealsTitle")} tiles={dealTiles} linkText={t(lang, "seeAllDeals")} linkHref="/s" />
          )}
          <SignInCard
            labels={{
              title: t(lang, "signInBest"),
              cta: t(lang, "signInSecurely"),
              newCustomer: t(lang, "newCustomer"),
              startHere: t(lang, "startHere"),
            }}
          />
        </div>

        <ProductRow title={t(lang, "todaysDealsTitle")} seeMore={t(lang, "seeMore")} href="/s" products={deals.slice(0, ROW_SIZE)} />
        <ProductRow title={t(lang, "topRated")} seeMore={t(lang, "seeMore")} href="/s?sort=rating" products={topRated.slice(0, ROW_SIZE)} />
        {categoryRows.map((c) => (
          <ProductRow
            key={c.id}
            title={t(lang, "bestIn", { name: c.name })}
            seeMore={t(lang, "seeMore")}
            href={`/s?cat=${c.slug}`}
            products={byCategory.get(c.id)!.slice(0, ROW_SIZE)}
          />
        ))}

        {products.length === 0 && (
          <p className="rounded bg-white p-8 text-center text-[#565959]">{t(lang, "noProducts")}</p>
        )}
      </div>
    </div>
  );
}
