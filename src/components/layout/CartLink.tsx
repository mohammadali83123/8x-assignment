import Link from "next/link";
import { getLang, t } from "@/lib/i18n";

export async function CartLink({ count }: { count: number }) {
  const lang = await getLang();
  return (
    <Link href="/cart" aria-label={t(lang, "cartAria", { n: count })} className="flex items-end gap-0.5 rounded border border-transparent px-2 py-1 hover:border-white">
      <span className="relative block h-10 w-11">
        <svg viewBox="0 0 44 40" className="absolute inset-0 h-full w-full" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 13h6l4.5 17h19L37 17H11" />
          <circle cx="15" cy="35" r="1.8" fill="white" stroke="none" />
          <circle cx="29" cy="35" r="1.8" fill="white" stroke="none" />
        </svg>
        <span className="absolute left-[22px] top-0 w-6 -translate-x-1/2 text-center text-[15px] font-bold leading-none text-[#ff9900]">
          {count}
        </span>
      </span>
      <span className="hidden pb-0.5 text-sm font-bold sm:block">{t(lang, "cart")}</span>
    </Link>
  );
}
