import { redirect } from "next/navigation";

// Amazon has a single email-first entry point: it decides between "sign in" and "create account".
export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  redirect(typeof next === "string" ? `/signin?next=${encodeURIComponent(next)}` : "/signin");
}
