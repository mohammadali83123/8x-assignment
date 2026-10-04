import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const safeNext = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";

/**
 * Landing point of the email-confirmation link. Supabase has already verified the token
 * by the time we get here, so even if the session exchange fails (e.g. the link was opened
 * in another browser) the address is confirmed and the user can simply sign in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const signin = (params: Record<string, string>) =>
    NextResponse.redirect(`${origin}/signin?${new URLSearchParams({ ...params, next })}`);

  const linkError = searchParams.get("error_description");
  if (linkError) return signin({ error: linkError.replace(/\+/g, " ") });

  const code = searchParams.get("code");
  if (!code) return signin({ notice: "confirmed" });

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return signin({ notice: "confirmed" });

  // The DB trigger only covers brand-new auth rows; guest upgrades need the profile filled in here.
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("profiles").upsert({ id: data.user.id, full_name: data.user.user_metadata?.full_name ?? null });
  }
  return NextResponse.redirect(`${origin}${next}`);
}
