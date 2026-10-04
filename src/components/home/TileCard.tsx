import Link from "next/link";

export type Tile = { label: string; href: string; image: string | null };

export function TileCard({
  title,
  tiles,
  linkText,
  linkHref,
}: {
  title: string;
  tiles: Tile[];
  linkText: string;
  linkHref: string;
}) {
  return (
    <section className="flex flex-col rounded bg-white p-5">
      <h2 className="mb-3 text-xl font-bold leading-tight">{title}</h2>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group flex flex-col gap-1">
            <div className="flex aspect-square items-center justify-center bg-[#f7f7f7]">
              {t.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
              )}
            </div>
            <span className="line-clamp-1 text-xs group-hover:text-[#c7511f]">{t.label}</span>
          </Link>
        ))}
      </div>
      <Link href={linkHref} className="mt-4 text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
        {linkText}
      </Link>
    </section>
  );
}

export type SignInLabels = { title: string; cta: string; newCustomer: string; startHere: string };

export function SignInCard({ labels }: { labels: SignInLabels }) {
  return (
    <section className="flex flex-col gap-3 rounded bg-white p-5">
      <h2 className="text-xl font-bold leading-tight">{labels.title}</h2>
      <Link href="/signin" className="rounded-lg bg-[#ffd814] py-2 text-center text-sm hover:bg-[#f7ca00]">
        {labels.cta}
      </Link>
      <p className="mt-auto text-sm text-[#565959]">
        {labels.newCustomer}{" "}
        <Link href="/signup" className="text-[#007185] hover:text-[#c7511f] hover:underline">
          {labels.startHere}
        </Link>
      </p>
    </section>
  );
}
