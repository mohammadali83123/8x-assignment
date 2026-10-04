import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mergeGuestCart, readGuestCart } from "@/lib/cart-merge";

const safeNext = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";

/**
 * Landing point of the email-confirmation link. Supabase verifies the token before redirecting
 * here, so reaching this route with a `code` means the address IS confirmed. The code can only be
 * exchanged for a session in the browser that started the sign-up; on any other device (e.g. the
 * phone that opened the email) the exchange fails, and the confirmed page explains what to do.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const to = (path: string, params: Record<string, string>) =>
    NextResponse.redirect(`${origin}${path}?${new URLSearchParams({ ...params, next })}`);

  const linkError = searchParams.get("error_description");
  if (linkError) return to("/signin", { error: linkError.replace(/\+/g, " ") });

  const code = searchParams.get("code");
  if (!code) return to("/signin", {});

  const supabase = await createClient();
  const guestCart = await readGuestCart(supabase);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // Password-reset links only work in the browser that asked for them (the code is bound to it).
  if (searchParams.get("type") === "recovery") {
    return error
      ? to("/signin", { error: "Open the password reset link in the same browser where you requested it, or request a new one." })
      : to("/auth/reset", {});
  }

  if (!error) {
    // Make sure the profile has the name, and bring over whatever the visitor put in their guest cart.
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: data.user.user_metadata?.full_name ?? null });
      await mergeGuestCart(guestCart, data.user.id);
    }
  }
  return to("/auth/confirmed", {});
}
