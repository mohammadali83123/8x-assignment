import { AuthShell } from "@/components/auth/AuthShell";
import { AuthFlow } from "@/components/auth/AuthFlow";

export const metadata = { title: "Amazon Sign-In" };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <AuthShell>
      <AuthFlow next={nextPath} error={typeof error === "string" ? error : undefined} />
    </AuthShell>
  );
}
