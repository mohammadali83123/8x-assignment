import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { yellowButton } from "@/components/auth/styles";
import { getUser, isGuest } from "@/lib/supabase/server";

export const metadata = { title: "Email confirmed" };

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const signedIn = !isGuest(await getUser());

  return (
    <AuthShell title="Email confirmed">
      <p role="status" className="rounded-lg border border-[#067d62] bg-[#f0faf7] p-3 text-sm text-[#067d62]">
        Your email address has been confirmed.
      </p>
      {signedIn ? (
        <>
          <p className="mt-3 text-sm">You&apos;re signed in on this device.</p>
          <Link href={nextPath} className={`${yellowButton} mt-4 block text-center`}>
            Continue
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-[#565959]">
            Signed up on another device? That page will continue on its own. To use your account here, sign in.
          </p>
          <Link href={`/signin?next=${encodeURIComponent(nextPath)}`} className={`${yellowButton} mt-4 block text-center`}>
            Sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
