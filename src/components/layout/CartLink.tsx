import Link from "next/link";

export function CartLink({ count }: { count: number }) {
  return (
    <Link href="/cart" aria-label={`Cart, ${count} items`} className="flex items-end rounded border border-transparent px-2 py-1 hover:border-white">
      <span className="relative">
        <svg viewBox="0 0 32 28" className="h-8 w-9" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M1 2h5l3.5 15h14L27 7H8" />
          <circle cx="12" cy="23" r="2" fill="white" />
          <circle cx="22" cy="23" r="2" fill="white" />
        </svg>
        <span className="absolute -top-1 left-3 w-6 text-center text-base font-bold text-[#ff9900]">{count}</span>
      </span>
      <span className="hidden text-sm font-bold sm:block">Cart</span>
    </Link>
  );
}
