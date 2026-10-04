"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser, isGuest } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

async function requireUser() {
  const user = await getUser();
  if (!user || isGuest(user)) redirect("/signin?next=/account");
  return user;
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function updateName(formData: FormData) {
  const user = await requireUser();
  const name = text(formData, "name");
  if (!name) return;
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { full_name: name } });
  await supabase.from("profiles").upsert({ id: user.id, full_name: name });
  revalidatePath("/", "layout");
  redirect("/account/security?saved=1");
}

export async function saveAddress(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const id = text(formData, "id");
  const wantsDefault = formData.get("is_default") === "on";
  const row = {
    full_name: text(formData, "full_name"),
    line1: text(formData, "line1"),
    line2: text(formData, "line2") || null,
    city: text(formData, "city"),
    state: text(formData, "state"),
    zip: text(formData, "zip"),
    country: text(formData, "country") || "United States",
    phone: text(formData, "phone") || null,
    is_default: wantsDefault,
  };
  if (!row.full_name || !row.line1 || !row.city || !row.state || !row.zip) return;

  if (wantsDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }
  if (id) await supabase.from("addresses").update(row).eq("id", id);
  else await supabase.from("addresses").insert({ ...row, user_id: user.id });
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", text(formData, "id"));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", text(formData, "id"));
  revalidatePath("/account/addresses");
}
