import type { Category } from "@/types/db";

export type SearchLabels = { all: string; category: string; placeholder: string; search: string };

export function SearchBar({ categories, labels }: { categories: Pick<Category, "slug" | "name">[]; labels: SearchLabels }) {
  return (
    <form action="/s" method="get" role="search" className="flex h-10 w-full overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-[#ff9900]">
      <select
        name="cat"
        aria-label={labels.category}
        defaultValue=""
        className="w-14 max-w-[8rem] shrink-0 cursor-pointer border-r border-[#cdcdcd] bg-[#e6e6e6] px-1 text-xs text-[#555] hover:bg-[#d4d4d4] sm:w-auto sm:px-2"
      >
        <option value="">{labels.all}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="k"
        type="search"
        placeholder={labels.placeholder}
        aria-label={labels.search}
        className="min-w-0 flex-1 bg-white px-3 text-[#0f1111] outline-none"
      />
      <button type="submit" aria-label={labels.search} className="flex w-11 shrink-0 items-center justify-center bg-[#febd69] hover:bg-[#f3a847]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#131921" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M16 16l5 5" />
        </svg>
      </button>
    </form>
  );
}
