"use client";

import { usePathname } from "next/navigation";

// Amazon's sign-in pages are chrome-free: no site header or footer.
const BARE = ["/signin", "/signup", "/auth"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return BARE.some((p) => path === p || path.startsWith(`${p}/`)) ? null : <>{children}</>;
}
