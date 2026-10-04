import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";
import type { Address } from "@/types/db";
import { deleteAddress, saveAddress, setDefaultAddress } from "../actions";
import { inputClass, yellowButton, grayButton } from "@/components/auth/styles";

export const metadata = { title: "Your Addresses" };

function AddressForm({ address }: { address?: Address }) {
  const f = (label: string, name: keyof Address, opts: { required?: boolean; value?: string } = {}) => (
    <label className="block text-sm font-bold">
      {label}
      <input
        name={name}
        required={opts.required}
        defaultValue={opts.value ?? (address?.[name] as string | null) ?? ""}
        className={inputClass}
      />
    </label>
  );
  return (
    <form action={saveAddress} className="space-y-3 rounded-lg border border-[#d5d9d9] bg-white p-5">
      <h2 className="text-xl">{address ? "Edit address" : "Add a new address"}</h2>
      {address && <input type="hidden" name="id" value={address.id} />}
      {f("Full name", "full_name", { required: true })}
      {f("Address line 1", "line1", { required: true })}
      {f("Address line 2", "line2")}
      <div className="grid grid-cols-2 gap-3">
        {f("City", "city", { required: true })}
        {f("State", "state", { required: true })}
        {f("ZIP code", "zip", { required: true })}
        {f("Country", "country", { value: address?.country ?? "United States" })}
      </div>
      {f("Phone number", "phone")}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default} />
        Make this my default address
      </label>
      <div className="flex gap-2">
        <button className={yellowButton}>{address ? "Save changes" : "Add address"}</button>
        <Link href="/account/addresses" className={grayButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/account/addresses");
  const { add, edit } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  const addresses = (data ?? []) as Address[];
  const editing = typeof edit === "string" ? addresses.find((a) => a.id === edit) : undefined;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6">
      <nav className="mb-2 text-sm text-[#565959]">
        <Link href="/account" className="text-[#007185] hover:underline">
          Your Account
        </Link>{" "}
        › Your Addresses
      </nav>
      <h1 className="mb-4 text-[28px] font-normal">Your Addresses</h1>

      {add || editing ? (
        <div className="max-w-[600px]">
          <AddressForm address={editing} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/account/addresses?add=1"
            className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#c8c8c8] text-[#565959] hover:bg-white"
          >
            <span className="text-5xl leading-none">+</span>
            <span className="mt-2 text-xl font-bold">Add address</span>
          </Link>
          {addresses.map((a) => (
            <div key={a.id} className="flex flex-col rounded-lg border border-[#d5d9d9] bg-white">
              <div className="min-h-6 border-b border-[#d5d9d9] bg-[#f0f2f2] px-4 py-1 text-xs text-[#565959]">
                {a.is_default && "Default"}
              </div>
              <div className="flex-1 space-y-0.5 p-4 text-sm">
                <div className="font-bold">{a.full_name}</div>
                <div>{a.line1}</div>
                {a.line2 && <div>{a.line2}</div>}
                <div>
                  {a.city}, {a.state} {a.zip}
                </div>
                <div>{a.country}</div>
                {a.phone && <div>Phone: {a.phone}</div>}
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-[#d5d9d9] px-4 py-2 text-sm">
                <Link href={`/account/addresses?edit=${a.id}`} className="text-[#007185] hover:underline">
                  Edit
                </Link>
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-[#007185] hover:underline">Remove</button>
                </form>
                {!a.is_default && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-[#007185] hover:underline">Set as default</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
