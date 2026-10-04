"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/types/db";

type Cat = Pick<Category, "slug" | "name">;

const item = "shrink-0 rounded border border-transparent px-2 py-1.5 hover:border-white";

export type NavLabels = { nav: string; all: string; bestSellers: string; deals: string; browse: string; allProducts: string; close: string };

export function NavBar({ categories, labels }: { categories: Cat[]; labels: NavLabels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto bg-[#232f3e] px-2 text-sm text-white" aria-label={labels.nav}>
      <button type="button" onClick={() => setOpen(true)} className={`${item} flex items-center gap-1.5 font-bold`}>
        <svg viewBox="0 0 20 14" className="h-3.5 w-5" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M1 1h18M1 7h18M1 13h18" />
        </svg>
        {labels.all}
      </button>
      <Link href="/s?sort=rating" className={item}>
        {labels.bestSellers}
      </Link>
      <Link href="/s?sort=price-asc" className={item}>
        {labels.deals}
      </Link>
      {categories.slice(0, 6).map((c) => (
        <Link key={c.slug} href={`/s?cat=${c.slug}`} className={item}>
          {c.name}
        </Link>
      ))}

      {open && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="w-80 max-w-[85vw] overflow-y-auto bg-white text-[#0f1111] shadow-2xl">
            <div className="flex items-center justify-between bg-[#232f3e] px-5 py-3 text-lg font-bold text-white">
              {labels.browse}
              <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="text-2xl leading-none">
                &times;
              </button>
            </div>
            <ul className="py-2">
              <li>
                <Link href="/s" onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-[#eaeded]">
                  {labels.allProducts}
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/s?cat=${c.slug}`} onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-[#eaeded]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" aria-label={labels.close} onClick={() => setOpen(false)} className="flex-1 bg-black/80" />
        </div>
      )}
    </nav>
  );
}
