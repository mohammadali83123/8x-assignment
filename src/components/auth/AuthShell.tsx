import Link from "next/link";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[350px] px-4 py-8">
      <Link href="/" className="mb-4 block text-center text-3xl font-bold tracking-tight">
        amazon<span className="text-[#ff9900]">.clone</span>
      </Link>
      <div className="rounded-lg border border-[#ddd] bg-white p-5">
        <h1 className="mb-3 text-[28px] font-normal leading-tight">{title}</h1>
        {children}
      </div>
    </div>
  );
}
