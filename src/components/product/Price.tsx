import { percentOff, splitPrice, formatPrice } from "@/lib/format";

/** Amazon price block: superscript cents, optional "-NN%" badge and struck list price. */
export function Price({
  price,
  listPrice,
  size = "md",
}: {
  price: number;
  listPrice?: number | null;
  size?: "md" | "lg";
}) {
  const { whole, cents } = splitPrice(price);
  const off = percentOff(price, listPrice ?? null);
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {off > 0 && <span className={`text-[#cc0c39] ${big ? "text-2xl" : "text-base"}`}>-{off}%</span>}
      <span className="inline-flex items-start text-[#0f1111]">
        <span className="mt-[0.2em] text-[0.6em]">$</span>
        <span className={big ? "text-3xl" : "text-xl"}>{whole}</span>
        <span className="mt-[0.15em] text-[0.55em]">{cents}</span>
      </span>
      {off > 0 && listPrice && (
        <span className="text-xs text-[#565959]">
          List: <s>{formatPrice(listPrice)}</s>
        </span>
      )}
    </div>
  );
}
