import Link from "next/link";
import type { Review } from "@/types/db";
import { Stars } from "@/components/product/Stars";
import { ReviewForm } from "./ReviewForm";

const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export function Reviews({
  productId,
  reviews,
  canReview,
}: {
  productId: number;
  reviews: Review[];
  canReview: boolean;
}) {
  const total = reviews.length;
  const average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  return (
    <section id="reviews" className="scroll-mt-4 border-t border-[#d5d9d9] px-4 py-6 lg:px-6">
      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Customer reviews</h2>
          {total > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <Stars rating={average} size={20} />
                <span className="text-lg">{average.toFixed(1)} out of 5</span>
              </div>
              <p className="text-sm text-[#565959]">{total.toLocaleString("en-US")} global ratings</p>
              <ul className="space-y-1.5 text-sm">
                {[5, 4, 3, 2, 1].map((n) => {
                  const pct = Math.round((reviews.filter((r) => r.rating === n).length / total) * 100);
                  return (
                    <li key={n} className="flex items-center gap-3">
                      <span className="w-10 text-[#007185]">{n} star</span>
                      <span className="h-5 flex-1 overflow-hidden rounded-sm border border-[#d5d9d9] bg-[#f0f2f2]">
                        <span className="block h-full bg-[#ffa41c]" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-9 text-right text-[#007185]">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-[#565959]">No customer reviews yet.</p>
          )}
          <div className="border-t border-[#d5d9d9] pt-4">
            <h3 className="text-lg font-bold">Review this product</h3>
            {canReview ? (
              <div className="mt-2">
                <ReviewForm productId={productId} />
              </div>
            ) : (
              <p className="mt-2 text-sm">
                <Link href="/signin" className="text-[#007185] hover:text-[#c7511f] hover:underline">
                  Sign in to write a review
                </Link>
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-bold">Top reviews</h3>
          {total === 0 ? (
            <p className="text-sm text-[#565959]">Be the first to review this product.</p>
          ) : (
            <ul className="space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="space-y-1">
                  <p className="text-sm font-medium">{r.author_name}</p>
                  <div className="flex items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="text-sm font-bold">{r.title}</span>
                  </div>
                  <p className="text-xs text-[#565959]">Reviewed on {dateFmt.format(new Date(r.created_at))}</p>
                  {r.body && <p className="whitespace-pre-line text-sm">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
