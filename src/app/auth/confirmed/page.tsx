import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { getUser, isGuest } from "@/lib/supabase/server";

export const metadata = { title: "Email confirmed" };

const yellow = "block h-[31px] w-full rounded-full bg-[#ffd338] text-center text-[13px] leading-[31px] hover:bg-[#f3c622]";

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const signedIn = !isGuest(await getUser());

  return (
    <AuthShell>
      <h1 className="mb-3 text-[28px] font-normal leading-[1.2]">Email confirmed</h1>
      <p role="status" className="rounded-lg border border-[#067d62] bg-[#f0faf7] p-3 text-[13px] text-[#067d62]">
        Your email address has been confirmed.
      </p>
      {signedIn ? (
        <>
          <p className="mt-3 text-[13px]">You&apos;re signed in on this device.</p>
          <Link href={nextPath} className={`${yellow} mt-4`}>
            Continue
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 text-[13px] text-[#565959]">
            Signed up on another device? That page will continue on its own. To use your account here, sign in.
          </p>
          <Link href={`/signin?next=${encodeURIComponent(nextPath)}`} className={`${yellow} mt-4`}>
            Sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
