import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { Price } from "@/components/product/Price";
import { Stars } from "@/components/product/Stars";
import { ProductCard } from "@/components/product/ProductCard";
import { Gallery } from "@/components/pdp/Gallery";
import { BuyBox } from "@/components/pdp/BuyBox";
import { Reviews } from "@/components/pdp/Reviews";
import type { Product, ProductSummary, Review } from "@/types/db";

const parseId = (raw: string) => (/^\d{1,15}$/.test(raw) ? Number(raw) : null);

async function loadProduct(id: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return { supabase, product: data as Product | null };
}

export async function generateMetadata({ params }: PageProps<"/dp/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  if (id === null) return { title: "Product not found" };
  const { product } = await loadProduct(id);
  return { title: product ? `Amazon.com: ${product.title}` : "Product not found" };
}

function deliveryEstimate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d);
}

export default async function ProductPage({ params }: PageProps<"/dp/[id]">) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  const { supabase, product } = await loadProduct(id);
  if (!product) notFound();

  const [{ data: reviewRows }, { data: relatedRows }, user] = await Promise.all([
    supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }),
    product.category_id
      ? supabase
          .from("products")
          .select("id,title,price,list_price,rating,rating_count,thumbnail,is_prime")
          .eq("category_id", product.category_id)
          .neq("id", id)
          .limit(8)
      : Promise.resolve({ data: [] }),
    getUser(),
  ]);
  const reviews = (reviewRows ?? []) as Review[];
  const related = (relatedRows ?? []) as ProductSummary[];
  const images = product.images.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const bullets = product.description
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lowStock = product.stock <= 5;

  return (
    <div className="mx-auto max-w-[1500px] bg-white">
      <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_17rem] lg:p-6">
        <Gallery images={images} title={product.title} />
        <div className="space-y-3">
          <h1 className="text-2xl leading-8">{product.title}</h1>
          {product.brand && (
            <Link
              href={`/s?k=${encodeURIComponent(product.brand)}`}
              className="block text-sm text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              Visit the {product.brand} Store
            </Link>
          )}
          {product.rating_count > 0 && (
            <a href="#reviews" className="flex items-center gap-2 text-sm text-[#007185] hover:text-[#c7511f]">
              <span className="text-[#0f1111]">{product.rating.toFixed(1)}</span>
              <Stars rating={product.rating} />
              <span className="hover:underline">{product.rating_count.toLocaleString("en-US")} ratings</span>
            </a>
          )}
          <hr className="border-[#d5d9d9]" />
          <Price price={product.price} listPrice={product.list_price} size="lg" />
          {product.is_prime && <span className="block text-sm font-bold italic text-[#00a8e1]">prime</span>}
          <p className={`text-lg ${product.stock === 0 || lowStock ? "text-[#b12704]" : "text-[#007600]"}`}>
            {product.stock === 0
              ? "Currently unavailable"
              : lowStock
                ? `Only ${product.stock} left in stock`
                : "In Stock"}
          </p>
          {bullets.length > 0 && (
            <>
              <h2 className="pt-2 text-base font-bold">About this item</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <BuyBox
            productId={product.id}
            price={product.price}
            listPrice={product.list_price}
            stock={product.stock}
            isPrime={product.is_prime}
            delivery={deliveryEstimate()}
            seller={product.brand ?? "Amazon.com"}
          />
        </div>
      </div>

      <Reviews productId={product.id} reviews={reviews} canReview={!isGuest(user)} />

      {related.length > 0 && (
        <section className="border-t border-[#d5d9d9] px-4 py-6 lg:px-6">
          <h2 className="mb-4 text-xl font-bold">Related products</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
