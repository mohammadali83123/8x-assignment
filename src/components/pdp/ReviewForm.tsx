"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/dp/[id]/actions";

export function ReviewForm({ productId }: { productId: number }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(form: FormData) {
    form.set("rating", String(rating));
    startTransition(async () => {
      const result = await submitReview(productId, form);
      setMessage(result.ok ? { ok: true, text: "Thanks! Your review has been saved." } : { ok: false, text: result.error });
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
          >
            <Star
              size={28}
              strokeWidth={1.5}
              className={`text-[#de7921] ${n <= (hover || rating) ? "fill-[#de7921]" : ""}`}
            />
          </button>
        ))}
      </div>
      <input
        name="title"
        required
        maxLength={150}
        placeholder="Headline"
        className="w-full rounded border border-[#888c8c] px-2 py-1.5 text-sm"
      />
      <textarea
        name="body"
        rows={4}
        maxLength={5000}
        placeholder="What did you like or dislike?"
        className="w-full rounded border border-[#888c8c] px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#ffd814] px-6 py-1.5 text-sm hover:bg-[#f7ca00] disabled:opacity-60"
      >
        Submit review
      </button>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-[#067d62]" : "text-[#b12704]"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
