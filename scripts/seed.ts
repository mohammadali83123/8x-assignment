/**
 * Seeds categories, products, seed reviewers and reviews from DummyJSON.
 * Run: npx tsx scripts/seed.ts   (needs .env.local with Supabase URL + service role key)
 *
 * Idempotent: categories upsert on slug; products match on title (update if present,
 * insert otherwise); seed reviewers are looked up by email; seed reviews are deleted and
 * regenerated every run from a fixed PRNG seed. Products without seeded reviews keep the
 * DummyJSON-derived rating (reviewed products get rating/count from the DB trigger).
 */
import { config } from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

config({ path: ".env.local" });

type DummyProduct = {
  title: string; description: string; category: string; price: number;
  discountPercentage: number; rating: number; stock: number; brand?: string;
  images: string[]; thumbnail: string;
};

const DEPARTMENTS: Record<string, { name: string; sources: string[] }> = {
  electronics: { name: "Electronics", sources: ["smartphones", "tablets", "mobile-accessories"] },
  computers: { name: "Computers & Laptops", sources: ["laptops"] },
  beauty: { name: "Beauty & Personal Care", sources: ["beauty", "skin-care", "fragrances"] },
  "home-kitchen": { name: "Home & Kitchen", sources: ["home-decoration", "kitchen-accessories"] },
  furniture: { name: "Furniture", sources: ["furniture"] },
  grocery: { name: "Grocery", sources: ["groceries"] },
  "mens-fashion": { name: "Men's Fashion", sources: ["mens-shirts", "mens-shoes"] },
  "womens-fashion": { name: "Women's Fashion", sources: ["tops", "womens-dresses", "womens-shoes", "womens-bags"] },
  jewelry: { name: "Jewelry", sources: ["womens-jewellery"] },
  watches: { name: "Watches", sources: ["mens-watches", "womens-watches"] },
  "sports-outdoors": { name: "Sports & Outdoors", sources: ["sports-accessories", "sunglasses"] },
  automotive: { name: "Automotive", sources: ["motorcycle", "vehicle"] },
};

const FALLBACK_BRANDS: Record<string, string[]> = {
  groceries: ["Fresh Farms", "Nature's Basket", "Green Valley"],
  "home-decoration": ["Casa Home", "Willow & Oak", "Urban Nest"],
  "kitchen-accessories": ["ChefMate", "KitchenPro", "Homestead"],
  furniture: ["Oakridge", "Nordic Living", "Haven"],
  "sports-accessories": ["ProFit", "ActiveGear", "Summit"],
  vehicle: ["Velocity", "AutoMax", "Roadster"],
  motorcycle: ["Ridgeline", "Thunder", "IronRoad"],
  default: ["Generic Goods", "Everyday Essentials", "Prime Choice"],
};

const REVIEWERS = [
  "Emily Carter", "James Wilson", "Priya Patel", "Michael Brown",
  "Sofia Martinez", "David Kim", "Rachel Green", "Daniel Thompson",
];

const REVIEW_TEMPLATES: Record<number, { titles: string[]; bodies: string[] }> = {
  5: {
    titles: ["Absolutely love it!", "Exceeded my expectations", "Best purchase this year", "Five stars, no question", "Worth every penny"],
    bodies: [
      "Arrived early and works perfectly. The quality is outstanding for the price and I would buy it again without hesitation.",
      "I was skeptical at first, but this turned out to be fantastic. Great build, great value, and my whole family loves it.",
      "Exactly as described and even better in person. Highly recommend to anyone on the fence.",
    ],
  },
  4: {
    titles: ["Really good, minor nitpicks", "Solid choice", "Happy with this purchase", "Good value for the money"],
    bodies: [
      "Does what it says and feels well made. Knocked off one star because the packaging was a bit rough, but the product itself is great.",
      "Very pleased overall. A couple of small things could be better, but I would still recommend it.",
      "Good quality and fast delivery. It took a little getting used to, but now I use it every day.",
    ],
  },
  3: {
    titles: ["It's okay", "Decent but not amazing", "Average for the price", "Does the job"],
    bodies: [
      "It works, but it is nothing special. Fine if you are on a budget, though I expected a little more.",
      "Mixed feelings. Some things are great, others feel cheap. Probably fair for what it costs.",
      "Acceptable quality. Not bad, not great. Might look at alternatives next time.",
    ],
  },
  2: {
    titles: ["Disappointed", "Not what I expected", "Could be much better"],
    bodies: [
      "The photos made it look nicer than it really is. Quality feels below what I hoped for at this price.",
      "Had some issues out of the box and it just does not feel durable. Wouldn't buy again.",
    ],
  },
  1: {
    titles: ["Do not recommend", "Waste of money", "Very poor quality"],
    bodies: [
      "Stopped working shortly after I got it. Very frustrating experience and I am requesting a refund.",
      "Nothing like the description. Cheap materials and poor finish. Avoid.",
    ],
  },
};

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function check<T>(r: { data: T | null; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data as T;
}

async function main() {
  const db = createAdminClient();
  const rand = mulberry32(20240607);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const res = await fetch("https://dummyjson.com/products?limit=0");
  const { products }: { products: DummyProduct[] } = await res.json();
  console.log(`Fetched ${products.length} products`);

  const sourceToDept = new Map<string, string>();
  for (const [slug, d] of Object.entries(DEPARTMENTS)) d.sources.forEach((s) => sourceToDept.set(s, slug));

  const categoryRows = Object.entries(DEPARTMENTS).map(([slug, d]) => ({
    slug,
    name: d.name,
    image_url: products.find((p) => p.category === d.sources[0])?.thumbnail ?? null,
  }));
  const cats = check(await db.from("categories").upsert(categoryRows, { onConflict: "slug" }).select("id, slug"), "categories");
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  // Reviewers are reused by email; old seed reviews are cleared before products are rewritten.
  const { data: userList } = await db.auth.admin.listUsers({ perPage: 1000 });
  const reviewers: { id: string; name: string }[] = [];
  for (const [i, name] of REVIEWERS.entries()) {
    const email = `seed-reviewer-${i + 1}@example.com`;
    let user = userList?.users.find((u) => u.email === email);
    if (!user) {
      const created = await db.auth.admin.createUser({
        email,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { full_name: name },
      });
      if (created.error) throw new Error(`createUser: ${created.error.message}`);
      user = created.data.user;
    }
    reviewers.push({ id: user.id, name });
  }
  check(await db.from("reviews").delete().in("user_id", reviewers.map((r) => r.id)), "clear reviews");

  const existing = check(await db.from("products").select("id, title"), "existing products");
  const idByTitle = new Map(existing.map((p) => [p.title, p.id]));

  const rows = products.map((p) => {
    const dept = sourceToDept.get(p.category);
    if (!dept) throw new Error(`Unmapped category ${p.category}`);
    const brands = FALLBACK_BRANDS[p.category] ?? FALLBACK_BRANDS.default;
    const list = p.price / (1 - p.discountPercentage / 100);
    const hasList = rand() < 0.6 && p.discountPercentage > 1;
    return {
      title: p.title,
      description: p.description,
      brand: p.brand ?? pick(brands),
      category_id: catId.get(dept)!,
      price: p.price,
      list_price: hasList ? Math.max(Math.ceil(list) - 0.01, p.price + 1) : null,
      rating: Math.round(p.rating * 10) / 10,
      rating_count: 15 + Math.floor(rand() * 44986),
      stock: p.stock,
      images: p.images,
      thumbnail: p.thumbnail,
      is_prime: rand() < 0.7,
    };
  });

  const toInsert = rows.filter((r) => !idByTitle.has(r.title));
  for (const r of rows.filter((r) => idByTitle.has(r.title))) {
    check(await db.from("products").update(r).eq("id", idByTitle.get(r.title)!), "update product");
  }
  if (toInsert.length) check(await db.from("products").insert(toInsert), "insert products");

  const all = check(await db.from("products").select("id, rating"), "products");
  const reviews: object[] = [];
  const now = Date.now();
  for (const p of all) {
    if (rand() > 0.45) continue;
    const n = 3 + Math.floor(rand() * 4);
    const authors = [...reviewers].sort(() => rand() - 0.5).slice(0, n);
    for (const a of authors) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(p.rating) + (rand() - 0.5) * 2.4)));
      const t = REVIEW_TEMPLATES[rating];
      reviews.push({
        product_id: p.id,
        user_id: a.id,
        author_name: a.name,
        rating,
        title: pick(t.titles),
        body: pick(t.bodies),
        created_at: new Date(now - Math.floor(rand() * 400) * 86400000).toISOString(),
      });
    }
  }
  check(await db.from("reviews").insert(reviews), "insert reviews");
  console.log(`Seeded ${categoryRows.length} categories, ${rows.length} products, ${reviews.length} reviews`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
