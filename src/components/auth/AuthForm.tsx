"use client";

import { useActionState } from "react";
import { resendConfirmation, type AuthState } from "@/app/(auth)/actions";
import { inputClass } from "./styles";

type Props = {
  mode: "signin" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
  notice?: { kind: "success" | "error"; text: string };
};

function ConfirmEmail({ email, next }: { email: string; next: string }) {
  const [state, resend, pending] = useActionState(resendConfirmation, undefined);
  return (
    <div className="space-y-3 text-sm">
      <p className="rounded-lg border border-[#067d62] bg-[#f0faf7] p-3 text-[#067d62]" role="status">
        We sent a confirmation link to <b>{state?.sent ?? email}</b>. Open it to finish setting up your account.
      </p>
      <p className="text-[#565959]">Can&apos;t find it? Check your spam folder or send it again.</p>
      {state?.error && (
        <p role="alert" className="text-[#c40000]">
          {state.error}
        </p>
      )}
      <form action={resend}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <button disabled={pending} className="w-full rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] py-1.5 hover:bg-[#e3e6e6] disabled:opacity-60">
          {pending ? "Sending..." : "Resend confirmation email"}
        </button>
      </form>
    </div>
  );
}

function ResendInline({ email, next }: { email: string; next: string }) {
  const [state, resend, pending] = useActionState(resendConfirmation, undefined);
  return (
    <div className="text-sm">
      {state?.sent ? (
        <p role="status" className="text-[#067d62]">
          Confirmation email sent to {state.sent}.
        </p>
      ) : (
        <form action={resend}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <button disabled={pending} className="text-[#007185] hover:text-[#c45500] hover:underline disabled:opacity-60">
            {pending ? "Sending..." : "Resend confirmation email"}
          </button>
        </form>
      )}
    </div>
  );
}

export function AuthForm({ mode, action, next, notice }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const signup = mode === "signup";

  if (state?.sent) return <ConfirmEmail email={state.sent} next={next} />;

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="next" value={next} />
      {notice && !state?.error && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${notice.kind === "error" ? "border-[#c40000] text-[#c40000]" : "border-[#067d62] bg-[#f0faf7] text-[#067d62]"}`}
        >
          {notice.text}
        </div>
      )}
      {state?.error && (
        <div role="alert" className="rounded-lg border border-[#c40000] p-3 text-sm text-[#c40000]">
          {state.error}
        </div>
      )}
      {state?.unconfirmed && (
        <ResendInline email={state.unconfirmed} next={next} />
      )}
      {signup && (
        <label className="block text-sm font-bold">
          Your name
          <input name="name" required autoComplete="name" placeholder="First and last name" className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-bold">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-sm font-bold">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={signup ? 6 : undefined}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={signup ? "At least 6 characters" : undefined}
          className={inputClass}
        />
      </label>
      {signup && (
        <label className="block text-sm font-bold">
          Re-enter password
          <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
        </label>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg border border-[#fcd200] bg-[#ffd814] py-1.5 text-sm hover:bg-[#f7ca00] disabled:opacity-60"
      >
        {pending ? "Please wait..." : signup ? "Continue" : "Sign in"}
      </button>
    </form>
  );
}
