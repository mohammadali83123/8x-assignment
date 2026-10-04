import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { signIn } from "../actions";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";
  const query = nextPath === "/" ? "" : `?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthShell title="Sign in">
      <AuthForm
        mode="signin"
        action={signIn}
        next={nextPath}
        notice={typeof error === "string" ? { kind: "error", text: error } : undefined}
      />
      <div className="mt-5 flex items-center gap-2 text-xs text-[#767676]">
        <span className="h-px flex-1 bg-[#e7e7e7]" />
        New to Amazon?
        <span className="h-px flex-1 bg-[#e7e7e7]" />
      </div>
      <Link
        href={`/signup${query}`}
        className="mt-3 block w-full rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] py-1.5 text-center text-sm hover:bg-[#e3e6e6]"
      >
        Create your Amazon account
      </Link>
    </AuthShell>
  );
}
