import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { signUp } from "../actions";

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";
  const query = nextPath === "/" ? "" : `?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthShell title="Create account">
      <AuthForm mode="signup" action={signUp} next={nextPath} />
      <p className="mt-5 border-t border-[#e7e7e7] pt-4 text-sm">
        Already have an account?{" "}
        <Link href={`/signin${query}`} className="text-[#007185] hover:text-[#c45500] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
