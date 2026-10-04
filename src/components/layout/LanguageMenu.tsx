import { getLang, LANGS, t } from "@/lib/i18n";
import { setLanguage } from "./actions";

export function UsFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 19 12" className={className} aria-hidden>
      <rect width="19" height="12" fill="#fff" />
      {[0, 2, 4, 6, 8, 10].map((y) => (
        <rect key={y} y={y} width="19" height="1.0" fill="#b22234" />
      ))}
      <rect width="8" height="6.4" fill="#3c3b6e" />
    </svg>
  );
}

export async function LanguageMenu() {
  const lang = await getLang();
  return (
    <div className="group relative hidden md:block">
      <button type="button" className="flex items-center gap-1 rounded border border-transparent px-2 py-3 text-sm font-bold group-hover:border-white group-focus-within:border-white">
        <UsFlag className="h-3 w-[18px]" />
        {lang.toUpperCase()}
        <span className="text-[9px] text-[#ccc]">&#9660;</span>
      </button>
      <div className="invisible absolute right-0 top-full z-50 w-56 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded bg-white p-4 text-sm text-[#0f1111] shadow-xl">
          <p className="mb-2 font-bold">{t(lang, "changeLanguage")}</p>
          <ul role="radiogroup" className="space-y-2">
            {LANGS.map((l) => (
              <li key={l.code}>
                <form action={setLanguage.bind(null, l.code)}>
                  <button type="submit" role="radio" aria-checked={l.code === lang} className="flex w-full items-center gap-2 text-left hover:text-[#c45500]">
                    <span className={`inline-block h-3.5 w-3.5 rounded-full border ${l.code === lang ? "border-[#e77600] bg-[#e77600] ring-2 ring-white ring-inset" : "border-[#888]"}`} />
                    {l.name} - {l.code.toUpperCase()}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2 border-t border-[#ddd] pt-3 text-xs text-[#565959]">
            <UsFlag className="h-3 w-[18px]" /> {t(lang, "shoppingOn")}
          </p>
        </div>
      </div>
    </div>
  );
}
