import Link from "next/link";
import { signOut } from "./actions";

const links = [
  { href: "/account", label: "Your Account" },
  { href: "/orders", label: "Your Orders" },
];

export function AccountMenu({ name }: { name: string | null }) {
  return (
    <div className="group relative">
      <Link href={name ? "/account" : "/signin"} className="block rounded border border-transparent px-2 py-1 leading-tight group-hover:border-white group-focus-within:border-white">
        <span className="block max-w-28 truncate text-xs">Hello, {name ?? "sign in"}</span>
        <span className="hidden text-sm font-bold sm:block">Account &amp; Lists</span>
      </Link>
      <div className="invisible absolute right-0 top-full z-50 w-64 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded bg-white p-4 text-sm text-[#0f1111] shadow-xl">
          {name ? (
            <form action={signOut}>
              <button type="submit" className="w-full rounded-lg bg-[#ffd814] py-1.5 text-sm hover:bg-[#f7ca00]">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/signin" className="block rounded-lg bg-[#ffd814] py-1.5 text-center hover:bg-[#f7ca00]">
                Sign in
              </Link>
              <p className="mt-2 text-center text-xs">
                New customer?{" "}
                <Link href="/signup" className="text-[#007185] hover:text-[#c45500] hover:underline">
                  Start here.
                </Link>
              </p>
            </>
          )}
          <ul className="mt-3 space-y-1.5 border-t border-[#ddd] pt-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[#444] hover:text-[#c45500] hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
