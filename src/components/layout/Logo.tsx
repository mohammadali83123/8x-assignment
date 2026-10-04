import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="amazon.clone home" className="flex shrink-0 flex-col rounded border border-transparent px-2 py-1 hover:border-white">
      <span className="text-2xl font-bold leading-6 tracking-tight text-white">
        amazon<span className="text-sm font-normal text-white">.clone</span>
      </span>
      <svg viewBox="0 0 100 12" className="-mt-0.5 ml-4 h-2.5 w-16" aria-hidden>
        <path d="M2 2c25 10 60 10 92-1" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
        <path d="M86 1l9 0-2 8" fill="none" stroke="#ff9900" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
