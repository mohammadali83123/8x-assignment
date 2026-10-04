"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";

const label = "block text-[13px] font-bold leading-5";
const input =
  "mt-0.5 h-[31px] w-full rounded-[3px] border border-[#a6a6a6] border-t-[#949494] px-2 text-[13px] font-normal outline-none focus:border-[#007185] focus:shadow-[0_0_0_3px_#c8f3fa]";

export function ResetForm() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <label className={label}>
        New password (at least 6 characters)
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className={input} />
      </label>
      <label className={label}>
        Re-enter password
        <input name="confirm" type="password" required autoComplete="new-password" className={input} />
      </label>
      {state?.error && (
        <p role="alert" className="text-xs text-[#c40000]">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="h-[31px] w-full rounded-full bg-[#ffd338] text-[13px] hover:bg-[#f3c622] disabled:opacity-60">
        {pending ? "Please wait..." : "Save changes and sign in"}
      </button>
    </form>
  );
}
