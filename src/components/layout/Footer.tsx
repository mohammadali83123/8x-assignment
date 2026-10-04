import { BackToTop } from "./BackToTop";
import { UsFlag } from "./LanguageMenu";
import { Logo } from "./Logo";

const columns = [
  { title: "Get to Know Us", links: ["Careers", "Blog", "About Amazon", "Investor Relations", "Amazon Devices", "Amazon Science"] },
  {
    title: "Make Money with Us",
    links: [
      "Sell products on Amazon",
      "Sell on Amazon Business",
      "Sell apps on Amazon",
      "Become an Affiliate",
      "Advertise Your Products",
      "Self-Publish with Us",
      "Host an Amazon Hub",
      "› See More Make Money with Us",
    ],
  },
  { title: "Amazon Payment Products", links: ["Amazon Business Card", "Shop with Points", "Reload Your Balance", "Amazon Currency Converter"] },
  {
    title: "Let Us Help You",
    links: ["Your Account", "Your Orders", "Shipping Rates & Policies", "Returns & Replacements", "Manage Your Content and Devices", "Help"],
  },
];

// Display-only, mirroring the "Amazon services" strip at the bottom of amazon.com.
const services: [string, string][] = [
  ["Amazon Music", "Stream millions of songs"],
  ["Amazon Ads", "Reach customers wherever they spend their time"],
  ["6pm", "Score deals on fashion brands"],
  ["AbeBooks", "Books, art & collectibles"],
  ["ACX", "Audiobook Publishing Made Easy"],
  ["Sell on Amazon", "Start a Selling Account"],
  ["Veeqo", "Shipping Software Inventory Management"],
  ["Amazon Business", "Everything For Your Business"],
  ["AmazonGlobal", "Ship Orders Internationally"],
  ["Amazon Web Services", "Scalable Cloud Computing Services"],
  ["Audible", "Listen to Books & Original Audio Performances"],
  ["Box Office Mojo", "Find Movie Box Office Data"],
  ["Goodreads", "Book reviews & recommendations"],
  ["IMDb", "Movies, TV & Celebrities"],
  ["IMDbPro", "Get Info Entertainment Professionals Need"],
  ["Kindle Direct Publishing", "Indie Digital & Print Publishing Made Easy"],
  ["Prime Video Direct", "Video Distribution Made Easy"],
  ["Shopbop", "Designer Fashion Brands"],
  ["Woot!", "Deals and Shenanigans"],
  ["Zappos", "Shoes & Clothing"],
  ["Ring", "Smart Home Security Systems"],
  ["eero WiFi", "Stream 4K Video in Every Room"],
  ["Blink", "Smart Security for Every Home"],
  ["Neighbors App", "Real-Time Crime & Safety Alerts"],
  ["PillPack", "Pharmacy Simplified"],
];

const pill = "flex items-center gap-2 rounded border border-[#848688] px-3 py-2.5 text-sm hover:border-white";

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
          <span className={pill}>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="white" strokeWidth="1.5" aria-hidden>
              <circle cx="10" cy="10" r="8" />
              <path d="M2 10h16M10 2c3 3 3 13 0 16M10 2c-3 3-3 13 0 16" />
            </svg>
            English <span className="ml-2 text-[9px] text-[#ccc]">&#9650;&#9660;</span>
          </span>
          <span className={pill}>
            <b>PKR</b> Pakistani Rupee
          </span>
          <span className={pill}>
            <UsFlag className="h-3 w-[18px]" /> United States
          </span>
        </div>
      </div>
      <div className="bg-[#131a22] px-6 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-7">
          {services.map(([name, desc]) => (
            <a key={name} href="#" className="block text-[#999] hover:underline">
              <span className="block text-xs font-bold text-[#ddd]">{name}</span>
              <span className="block text-xs leading-snug">{desc}</span>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center text-xs text-[#ddd]">
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <span>Conditions of Use</span>
            <span>Privacy Notice</span>
            <span>Consumer Health Data Privacy Disclosure</span>
            <span>Your Ads Privacy Choices</span>
          </p>
          <p className="mt-2">
            &copy; 1996-{new Date().getFullYear()}, Amazon.clone &mdash; a clone built for an assignment; not affiliated with Amazon.com, Inc. or its affiliates.
          </p>
        </div>
      </div>
    </footer>
  );
}
