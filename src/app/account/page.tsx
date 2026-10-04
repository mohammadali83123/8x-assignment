import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, isGuest } from "@/lib/supabase/server";
import { signOutAction } from "./actions";
import { grayButton } from "@/components/auth/styles";

export const metadata = { title: "Your Account" };

const cards = [
  { href: "/orders", icon: "📦", title: "Your Orders", text: "Track, return, or buy things again" },
  { href: "/account/security", icon: "🔒", title: "Login & security", text: "Edit your name and view your email" },
  { href: "/account/addresses", icon: "📍", title: "Your Addresses", text: "Edit addresses for orders and gifts" },
];

export default async function AccountPage() {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/account");

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <h1 className="mb-4 text-[28px] font-normal">Your Account</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex gap-4 rounded-lg border border-[#d5d9d9] bg-white p-4 hover:bg-[#f7fafa]"
          >
            <span className="text-4xl" aria-hidden>
              {c.icon}
            </span>
            <span>
              <span className="block text-[17px]">{c.title}</span>
              <span className="text-sm text-[#565959]">{c.text}</span>
            </span>
          </Link>
        ))}
      </div>
      <form action={signOutAction} className="mt-6">
        <button className={grayButton}>Sign out</button>
      </form>
    </div>
  );
}
