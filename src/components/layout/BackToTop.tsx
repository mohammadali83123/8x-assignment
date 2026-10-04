"use client";

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="w-full bg-[#37475a] py-3.5 text-sm text-white hover:bg-[#485769]"
    >
      {label}
    </button>
  );
}
