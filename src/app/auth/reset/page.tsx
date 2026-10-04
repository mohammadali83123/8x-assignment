import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/ResetForm";
import { getUser, isGuest } from "@/lib/supabase/server";

export const metadata = { title: "Reset password" };

export default async function ResetPage() {
  const signedIn = !isGuest(await getUser());
  return (
    <AuthShell>
      <h1 className="mb-3 text-[28px] font-normal leading-[1.2]">Create new password</h1>
      {signedIn ? (
        <ResetForm />
      ) : (
        <>
          <p className="text-[13px]">This reset link has expired or was opened in a different browser. Request a new one from the sign-in page.</p>
          <Link href="/signin" className="mt-4 block h-[31px] w-full rounded-full bg-[#ffd338] text-center text-[13px] leading-[31px] hover:bg-[#f3c622]">
            Back to sign in
          </Link>
        </>
      )}
    </AuthShell>
  );
}
