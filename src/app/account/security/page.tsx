import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import { updateName } from "../actions";
import { inputClass, yellowButton } from "@/components/auth/styles";

export const metadata = { title: "Login & security" };

export default async function SecurityPage({ searchParams }: PageProps<"/account/security">) {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/account/security");
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      <nav className="mb-2 text-sm text-[#565959]">
        <Link href="/account" className="text-[#007185] hover:underline">
          Your Account
        </Link>{" "}
        › Login &amp; security
      </nav>
      <h1 className="mb-4 text-[28px] font-normal">Login &amp; security</h1>
      <form action={updateName} className="space-y-3 rounded-lg border border-[#d5d9d9] bg-white p-5">
        {saved && <p className="rounded border border-[#067d62] p-2 text-sm text-[#067d62]">Your name was updated.</p>}
        <label className="block text-sm font-bold">
          Name
          <input
            name="name"
            required
            defaultValue={profile?.full_name ?? ""}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <div className="text-sm">
          <div className="font-bold">Email</div>
          <div>{user.email}</div>
        </div>
        <button className={yellowButton}>Save changes</button>
      </form>
    </div>
  );
}
