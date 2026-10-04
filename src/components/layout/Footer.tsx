import { BackToTop } from "./BackToTop";
import { Logo } from "./Logo";

const columns = [
  { title: "Get to Know Us", links: ["Careers", "Blog", "About Amazon.clone", "Investor Relations", "Amazon Devices"] },
  { title: "Make Money with Us", links: ["Sell products", "Become an Affiliate", "Advertise Your Products", "Host a Hub"] },
  { title: "Payment Products", links: ["Business Card", "Shop with Points", "Reload Your Balance", "Currency Converter"] },
  { title: "Let Us Help You", links: ["Your Account", "Your Orders", "Shipping Rates & Policies", "Returns & Replacements", "Help"] },
];

export function Footer() {
  return (
    <footer className="mt-auto text-white">
      <BackToTop />
      <div className="bg-[#232f3e] px-6 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-2 text-base font-bold">{col.title}</h3>
              <ul className="space-y-1.5 text-sm text-[#ddd]">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#3a4553] bg-[#232f3e] px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4">
          <Logo />
          <span className="rounded border border-[#848688] px-3 py-1 text-sm">English</span>
          <span className="rounded border border-[#848688] px-3 py-1 text-sm">Pakistan</span>
        </div>
      </div>
      <div className="bg-[#131a22] px-6 py-5 text-center text-xs text-[#ddd]">
        <p>Conditions of Use &nbsp; Privacy Notice &nbsp; Your Ads Privacy Choices</p>
        <p className="mt-2">
          &copy; {new Date().getFullYear()} Amazon.clone &mdash; a clone built for an assignment; not affiliated with Amazon.com, Inc.
        </p>
      </div>
    </footer>
  );
}
