import Link from "next/link";
import { createClient, isGuest } from "@/lib/supabase/server";
import { getLang, t } from "@/lib/i18n";
import { AccountMenu } from "./AccountMenu";
import { CartLink } from "./CartLink";
import { LanguageMenu } from "./LanguageMenu";
import { Logo } from "./Logo";
import { NavBar } from "./NavBar";
import { SearchBar } from "./SearchBar";

export async function Header() {
  const lang = await getLang();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  const signedIn = user && !isGuest(user) ? user : null;

  const [{ data: categories }, profile, cart] = await Promise.all([
    supabase.from("categories").select("slug,name").order("name"),
    signedIn ? supabase.from("profiles").select("full_name").eq("id", signedIn.id).maybeSingle() : null,
    user ? supabase.from("cart_items").select("qty").eq("saved_for_later", false) : null,
  ]);

  const cats = categories ?? [];
  const fullName = profile?.data?.full_name ?? (signedIn?.user_metadata?.full_name as string | undefined);
  const name = signedIn ? (fullName ?? signedIn.email ?? "").split(/[\s@]/)[0] || "account" : null;
  const count = (cart?.data ?? []).reduce((sum, r) => sum + r.qty, 0);

  return (
    <header className="text-white">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 bg-[#131921] px-2 py-2 sm:flex-nowrap">
        <Logo />
        <div className="hidden shrink-0 items-end gap-1 rounded border border-transparent px-2 py-1 leading-tight hover:border-white lg:flex">
          <svg viewBox="0 0 24 24" className="mb-0.5 h-5 w-5" fill="none" stroke="white" strokeWidth="2" aria-hidden>
            <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>
            <span className="block text-xs text-[#ccc]">{t(lang, "deliverTo")}</span>
            <span className="block text-sm font-bold">{t(lang, "country")}</span>
          </span>
        </div>
        <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <SearchBar
            categories={cats}
            labels={{ all: t(lang, "all"), category: t(lang, "searchCategory"), placeholder: t(lang, "searchPlaceholder"), search: t(lang, "search") }}
          />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <LanguageMenu />
          <AccountMenu name={name} />
          <Link href="/orders" className="hidden rounded border border-transparent px-2 py-1 leading-tight hover:border-white md:block">
            <span className="block text-xs">{t(lang, "returns")}</span>
            <span className="block text-sm font-bold">{t(lang, "andOrders")}</span>
          </Link>
          <CartLink count={count} />
        </div>
      </div>
      <NavBar
        categories={cats}
        labels={{
          nav: t(lang, "departments"),
          all: t(lang, "all"),
          bestSellers: t(lang, "bestSellers"),
          deals: t(lang, "todaysDeals"),
          browse: t(lang, "browseDepartments"),
          allProducts: t(lang, "allProducts"),
          close: t(lang, "closeMenu"),
        }}
      />
    </header>
  );
}
