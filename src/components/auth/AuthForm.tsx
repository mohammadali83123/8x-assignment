"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/(auth)/actions";
import { inputClass } from "./styles";

type Props = {
  mode: "signin" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
};

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const signup = mode === "signup";

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <div role="alert" className="rounded-lg border border-[#c40000] p-3 text-sm text-[#c40000]">
          {state.error}
        </div>
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
