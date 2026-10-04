import Link from "next/link";
import { buildHref, type SearchParams } from "./query";

const btn = "rounded border px-3 py-1.5 text-sm";
const live = `${btn} border-[#d5d9d9] bg-white hover:bg-[#f7fafa]`;
const dead = `${btn} border-transparent text-[#6f7373]`;

export function Pagination({ p, pages }: { p: SearchParams; pages: number }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, pages, p.page - 1, p.page, p.page + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const href = (page: number) => buildHref(p, { page });

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 py-6">
      {p.page > 1 ? (
        <Link href={href(p.page - 1)} className={live}>
          ‹ Previous
        </Link>
      ) : (
        <span className={dead}>‹ Previous</span>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-[#565959]">…</span>}
          {n === p.page ? (
            <span aria-current="page" className={`${btn} border-[#e77600] bg-white font-bold shadow-[0_0_3px_#e77600]`}>
              {n}
            </span>
          ) : (
            <Link href={href(n)} className={live}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {p.page < pages ? (
        <Link href={href(p.page + 1)} className={live}>
          Next ›
        </Link>
      ) : (
        <span className={dead}>Next ›</span>
      )}
    </nav>
  );
}
