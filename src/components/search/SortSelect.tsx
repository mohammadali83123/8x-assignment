"use client";

import { useRouter } from "next/navigation";
import { SORTS, type Sort } from "./query";

/** `hrefs` maps each sort key to its target URL so the server keeps all other params. */
export function SortSelect({ value, hrefs }: { value: Sort; hrefs: Record<Sort, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline">Sort by:</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value as Sort])}
        className="rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2 py-1 text-sm shadow-sm"
      >
        {Object.entries(SORTS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
