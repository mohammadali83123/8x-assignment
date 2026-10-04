"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  checkConfirmed,
  lookupEmail,
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
} from "@/app/(auth)/actions";

type Step = "email" | "new" | "create" | "signin" | "forgot";

const label = "block text-[13px] font-bold leading-5";
const input =
  "mt-0.5 h-[31px] w-full rounded-[3px] border border-[#a6a6a6] border-t-[#949494] px-2 text-[13px] font-normal outline-none focus:border-[#007185] focus:shadow-[0_0_0_3px_#c8f3fa]";
const button = "h-[31px] w-full rounded-full bg-[#ffd338] text-[13px] hover:bg-[#f3c622] disabled:opacity-60";
const link = "text-[#0066c0] hover:text-[#c45500] hover:underline";
const title = "mb-3 text-[28px] font-normal leading-[1.2]";
const divider = "my-4 border-t border-[#e7e7e7]";

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-[#c40000]">
      <span aria-hidden className="mt-px inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#c40000] text-[10px] font-bold leading-none text-white">!</span>
      {children}
    </p>
  );
}

function EmailLine({ email, onChange }: { email: string; onChange: () => void }) {
  return (
    <p className="mb-3 text-[13px]">
      <span className="mr-2 break-all">{email}</span>
      <button type="button" onClick={onChange} className={link}>
        Change
      </button>
    </p>
  );
}

function Terms({ prefix }: { prefix: string }) {
  return (
    <p className="text-xs leading-[1.5]">
      {prefix}{" "}
      <a href="#" className={link}>Conditions of Use</a> and{" "}
      <a href="#" className={link}>Privacy Notice</a>.
    </p>
  );
}

// ---------------------------------------------------------------- step 1: email

function EmailStep({ initial, error, onResult }: { initial: string; error?: string; onResult: (email: string, exists: boolean) => void }) {
  const [value, setValue] = useState(initial);
  const [problem, setProblem] = useState(error);
  const [pending, start] = useTransition();

  return (
    <>
      <h1 className={title}>Sign in or create account</h1>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setProblem(undefined);
          start(async () => {
            const result = await lookupEmail(value);
            if ("error" in result) setProblem(result.error);
            else onResult(value.trim(), result.exists);
          });
        }}
      >
        <label className={label} htmlFor="auth-email">
          Enter mobile number or email
        </label>
        <div className="relative">
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setProblem(undefined);
            }}
            className={`${input} pr-8 ${problem ? "border-[#c40000]" : ""}`}
          />
          {value && (
            <button type="button" aria-label="Clear" onClick={() => setValue("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-lg leading-none text-[#555]">
              &times;
            </button>
          )}
        </div>
        {problem && <Alert>{problem}</Alert>}
        <button disabled={pending} className={`${button} mt-4`}>
          {pending ? "Please wait..." : "Continue"}
        </button>
      </form>
      <div className="mt-4">
        <Terms prefix="By continuing, you agree to Amazon's" />
      </div>
      <p className="mt-4 text-xs">
        <a href="#" className={link}>Need help?</a>
      </p>
      <div className={divider} />
      <p className="text-[13px] font-bold">Buying for work?</p>
      <a href="#" className={`${link} text-xs`}>Create a free business account</a>
    </>
  );
}

// ---------------------------------------------------------------- step 2: new customer

function NewStep({ email, onChange, onProceed }: { email: string; onChange: () => void; onProceed: () => void }) {
  return (
    <>
      <h1 className={title}>Looks like you&apos;re new to Amazon</h1>
      <EmailLine email={email} onChange={onChange} />
      <p className="mb-3 text-[13px]">Let&apos;s create an account using your email</p>
      <button type="button" onClick={onProceed} className={button}>
        Proceed to create an account
      </button>
      <div className={divider} />
      <p className="text-[13px] font-bold">Already a customer?</p>
      <button type="button" onClick={onChange} className={`${link} text-[13px]`}>
        Sign in with another email or mobile
      </button>
    </>
  );
}

// ---------------------------------------------------------------- confirmation wait

const POLL_MS = 10_000;
const MAX_CHECKS = 60;

function VerifyEmail({ email, password, next }: { email: string; password: string; next: string }) {
  const [state, resend, pending] = useActionState(resendConfirmation, undefined);
  const busy = useRef(false);
  const checks = useRef(0);

  // Once the emailed link is opened (on any device) the typed password signs this tab in.
  useEffect(() => {
    if (!password) return;
    const check = async () => {
      if (busy.current || checks.current >= MAX_CHECKS || document.visibilityState !== "visible") return;
      busy.current = true;
      checks.current += 1;
      try {
        const result = await checkConfirmed(email, password, next);
        if ("error" in result) checks.current = MAX_CHECKS;
      } finally {
        busy.current = false;
      }
    };
    const timer = setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [email, password, next]);

  return (
    <>
      <h1 className={title}>Verify email address</h1>
      <p className="rounded-lg border border-[#067d62] bg-[#f0faf7] p-3 text-[13px] text-[#067d62]" role="status">
        We sent a confirmation link to <b className="break-all">{state?.sent ?? email}</b>. Open it to finish creating your account.
      </p>
      <p className="mt-3 text-[13px] text-[#565959]">
        You can open the link on any device. This page continues on its own once your email is confirmed.
      </p>
      <p className="mt-2 text-[13px] text-[#565959]">Can&apos;t find it? Check your spam folder or send it again.</p>
      {state?.error && <Alert>{state.error}</Alert>}
      <form action={resend} className="mt-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <button disabled={pending} className={`${button} border border-[#d5d9d9] !bg-[#f0f2f2] hover:!bg-[#e3e6e6]`}>
          {pending ? "Sending..." : "Resend confirmation email"}
        </button>
      </form>
    </>
  );
}

// ---------------------------------------------------------------- step 3: create account

function CreateStep({ email, next, onChange, onSignIn }: { email: string; next: string; onChange: () => void; onSignIn: () => void }) {
  const [state, formAction, pending] = useActionState(signUp, undefined);
  const [typedPassword, setTypedPassword] = useState("");

  if (state?.sent) return <VerifyEmail email={state.sent} password={typedPassword} next={next} />;

  return (
    <>
      <h1 className={title}>Create account</h1>
      <form
        action={formAction}
        onSubmit={(e) => setTypedPassword(String(new FormData(e.currentTarget).get("password") ?? ""))}
        className="space-y-3"
      >
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={email} />
        <div>
          <span className={label}>Email</span>
          <p className="text-[13px]">
            <span className="mr-1.5 break-all">{email}</span>
            <button type="button" onClick={onChange} className={link}>Change</button>
          </p>
        </div>
        <label className={label}>
          Your name
          <input name="name" required autoComplete="name" placeholder="First and last name" className={input} />
        </label>
        <div>
          <label className={label}>
            Password (at least 6 characters)
            <input name="password" type="password" required minLength={6} autoComplete="new-password" className={input} />
          </label>
          <p className="mt-2 flex items-center gap-2 text-xs">
            <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#007185] text-[11px] font-bold italic leading-none text-white">i</span>
            Passwords must be at least 6 characters.
          </p>
        </div>
        <label className={label}>
          Re-enter password
          <input name="confirm" type="password" required autoComplete="new-password" className={input} />
        </label>
        {state?.error && <Alert>{state.error}</Alert>}
        <button disabled={pending} className={button}>
          {pending ? "Please wait..." : "Continue"}
        </button>
      </form>
      <div className={divider} />
      <p className="text-[13px] font-bold">Already a customer?</p>
      <button type="button" onClick={onSignIn} className={`${link} text-[13px]`}>
        Sign in instead
      </button>
      <div className="mt-4">
        <Terms prefix="By creating an account, you agree to Amazon's" />
      </div>
    </>
  );
}

// ---------------------------------------------------------------- step 4: sign in

function ResendLink({ email, next }: { email: string; next: string }) {
  const [state, resend, pending] = useActionState(resendConfirmation, undefined);
  if (state?.sent) return <p role="status" className="mt-2 text-xs text-[#067d62]">Confirmation email sent to {state.sent}.</p>;
  if (state?.error) return <Alert>{state.error}</Alert>;
  return (
    <form action={resend} className="mt-2">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <button disabled={pending} className={`${link} text-xs disabled:opacity-60`}>
        {pending ? "Sending..." : "Resend confirmation email"}
      </button>
    </form>
  );
}

function SignInStep({ email, next, onChange, onForgot }: { email: string; next: string; onChange: () => void; onForgot: () => void }) {
  const [state, formAction, pending] = useActionState(signIn, undefined);
  return (
    <>
      <h1 className={title}>Sign in</h1>
      <EmailLine email={email} onChange={onChange} />
      <form action={formAction}>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={email} />
        <div className="flex items-baseline justify-between">
          <label htmlFor="auth-password" className={label}>
            Password
          </label>
          <button type="button" onClick={onForgot} className={`${link} text-xs`}>
            Forgot password?
          </button>
        </div>
        <input id="auth-password" name="password" type="password" required autoFocus autoComplete="current-password" className={`${input} ${state?.error ? "border-[#c40000]" : ""}`} />
        {state?.error && <Alert>{state.error}</Alert>}
        {state?.unconfirmed && <ResendLink email={state.unconfirmed} next={next} />}
        <button disabled={pending} className={`${button} mt-4`}>
          {pending ? "Please wait..." : "Sign in"}
        </button>
      </form>
    </>
  );
}

// ---------------------------------------------------------------- forgot password

function ForgotStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <>
      <h1 className={title}>Password assistance</h1>
      {state?.sent ? (
        <p role="status" className="rounded-lg border border-[#067d62] bg-[#f0faf7] p-3 text-[13px] text-[#067d62]">
          If an account exists for <b className="break-all">{state.sent}</b>, we sent a link to reset your password. Open it in this browser.
        </p>
      ) : (
        <form action={formAction}>
          <p className="mb-3 text-[13px]">Enter the email address associated with your account and we&apos;ll send you a link to reset your password.</p>
          <input type="hidden" name="email" value={email} />
          <p className="mb-3 break-all text-[13px] font-bold">{email}</p>
          {state?.error && <Alert>{state.error}</Alert>}
          <button disabled={pending} className={button}>
            {pending ? "Sending..." : "Continue"}
          </button>
        </form>
      )}
      <div className={divider} />
      <button type="button" onClick={onBack} className={`${link} text-[13px]`}>
        Back to sign in
      </button>
    </>
  );
}

// ---------------------------------------------------------------- flow

export function AuthFlow({ next, error }: { next: string; error?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const restart = () => setStep("email");

  switch (step) {
    case "new":
      return <NewStep email={email} onChange={restart} onProceed={() => setStep("create")} />;
    case "create":
      return <CreateStep email={email} next={next} onChange={restart} onSignIn={() => setStep("signin")} />;
    case "signin":
      return <SignInStep email={email} next={next} onChange={restart} onForgot={() => setStep("forgot")} />;
    case "forgot":
      return <ForgotStep email={email} onBack={() => setStep("signin")} />;
    default:
      return (
        <EmailStep
          initial={email}
          error={error}
          onResult={(value, exists) => {
            setEmail(value);
            setStep(exists ? "signin" : "new");
          }}
        />
      );
  }
}
