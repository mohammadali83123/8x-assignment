"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/types/db";

type Cat = Pick<Category, "slug" | "name">;

const item = "shrink-0 rounded border border-transparent px-2 py-1.5 hover:border-white";

export function NavBar({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto bg-[#232f3e] px-2 text-sm text-white" aria-label="Departments">
      <button type="button" onClick={() => setOpen(true)} className={`${item} flex items-center gap-1.5 font-bold`}>
        <svg viewBox="0 0 20 14" className="h-3.5 w-5" stroke="white" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M1 1h18M1 7h18M1 13h18" />
        </svg>
        All
      </button>
      <Link href="/s?sort=rating" className={item}>
        Best Sellers
      </Link>
      <Link href="/s?sort=price-asc" className={item}>
        Today&apos;s Deals
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
              Browse departments
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="text-2xl leading-none">
                &times;
              </button>
            </div>
            <ul className="py-2">
              <li>
                <Link href="/s" onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-[#eaeded]">
                  All products
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
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="flex-1 bg-black/80" />
        </div>
      )}
    </nav>
  );
}
