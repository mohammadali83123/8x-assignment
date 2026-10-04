import Link from "next/link";

const link = "text-[#0066c0] hover:text-[#c45500] hover:underline";

/** Amazon's bare sign-in frame: centered logo, narrow card, thin footer. No site header/footer. */
export function AuthShell({ children, width = 350 }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto w-full flex-1 px-4 pb-10 pt-4" style={{ maxWidth: width + 32 }}>
        <Link href="/" aria-label="amazon.clone home" className="mb-3 flex flex-col items-center">
          <span className="text-[34px] font-bold leading-8 tracking-tight text-[#0f1111]">
            amazon<span className="text-sm font-normal">.clone</span>
          </span>
          <svg viewBox="0 0 100 12" className="-mt-0.5 ml-8 h-3 w-24" aria-hidden>
            <path d="M2 2c25 10 60 10 92-1" fill="none" stroke="#ff9900" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M86 1l9 0-2 8" fill="none" stroke="#ff9900" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="rounded-lg border border-[#ddd] bg-white px-[26px] py-5">{children}</div>
      </div>
      <footer className="border-t border-[#e7e7e7] bg-gradient-to-b from-[#f7f7f7] to-white px-4 py-6 text-center text-[11px] text-[#555]">
        <p className="space-x-5">
          <a href="#" className={link}>Conditions of Use</a>
          <a href="#" className={link}>Privacy Notice</a>
          <a href="#" className={link}>Help</a>
        </p>
        <p className="mt-2">&copy; 1996-{new Date().getFullYear()}, Amazon.clone &mdash; a clone built for an assignment; not affiliated with Amazon.com, Inc.</p>
      </footer>
    </div>
  );
}
