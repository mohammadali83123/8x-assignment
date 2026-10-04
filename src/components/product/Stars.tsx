import { Star } from "lucide-react";

/** Amazon-style gold star rating with an optional review count. */
export function Stars({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`} aria-label={`${rating} out of 5 stars`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - (i - 1)));
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-[#de7921]" strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="fill-[#de7921] text-[#de7921]" strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && <span className="text-sm text-[#007185]">{count.toLocaleString("en-US")}</span>}
    </span>
  );
}
