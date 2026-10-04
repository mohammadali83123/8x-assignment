"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { addAddress, placeOrder } from "@/app/checkout/actions";
import { computeTotals, deliveryWindow } from "./totals";
import type { CheckoutItem } from "./cart";
import type { Address } from "@/types/db";

const inputCls =
  "w-full rounded border border-[#a6a6a6] px-2 py-1.5 text-sm outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)]";
const yellowBtn = "rounded-lg border border-[#fcd200] bg-[#ffd814] text-sm hover:bg-[#f7ca00] disabled:opacity-60";

const emptyAddress = { full_name: "", line1: "", line2: "", city: "", state: "", zip: "", phone: "", is_default: false };

function validateCard(c: { number: string; name: string; expiry: string; cvc: string }) {
  if (!/^\d{13,19}$/.test(c.number.replace(/\s/g, ""))) return "Enter a valid card number.";
  if (!c.name.trim()) return "Enter the name on the card.";
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry);
  if (!m || +m[1] < 1 || +m[1] > 12) return "Enter the expiry date as MM/YY.";
  const now = new Date();
  const year = 2000 + +m[2];
  if (year < now.getFullYear() || (year === now.getFullYear() && +m[1] < now.getMonth() + 1)) {
    return "This card has expired.";
  }
  if (!/^\d{3,4}$/.test(c.cvc)) return "Enter a valid security code.";
  return null;
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d5d9d9] bg-white p-4">
      <h2 className="mb-3 text-lg font-bold">
        {n}&nbsp;&nbsp;{title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function CheckoutForm({ items, addresses: initial }: { items: CheckoutItem[]; addresses: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [selected, setSelected] = useState(initial.find((a) => a.is_default)?.id ?? initial[0]?.id ?? "");
  const [adding, setAdding] = useState(initial.length === 0);
  const [draft, setDraft] = useState(emptyAddress);
  const [addrError, setAddrError] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const [placing, startPlacing] = useTransition();

  const totals = computeTotals(items);
  const count = items.reduce((n, i) => n + i.qty, 0);

  function saveAddress() {
    setAddrError("");
    startSaving(async () => {
      const res = await addAddress(draft);
      if ("error" in res) return setAddrError(res.error);
      const added = res.address;
      setAddresses((prev) => [added, ...prev.map((a) => (added.is_default ? { ...a, is_default: false } : a))]);
      setSelected(added.id);
      setDraft(emptyAddress);
      setAdding(false);
    });
  }

  function submit() {
    if (!selected) return setError("Please select or add a delivery address.");
    const cardError = validateCard(card);
    if (cardError) return setError(cardError);
    setError("");
    startPlacing(async () => {
      const res = await placeOrder(selected);
      if (res?.error) setError(res.error);
    });
  }

  const setD = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  const setC = (k: keyof typeof card, fmt: (v: string) => string = (v) => v) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((c) => ({ ...c, [k]: fmt(e.target.value) }));
  const fmtExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Section n={1} title="Delivery address">
          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${selected === a.id ? "border-[#e77600] bg-[#fef8f2]" : "border-[#d5d9d9]"}`}
              >
                <input type="radio" name="address" checked={selected === a.id} onChange={() => setSelected(a.id)} className="mt-1 accent-[#e77600]" />
                <span>
                  <b>{a.full_name}</b> {a.line1}
                  {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.zip}, {a.country}
                  {a.phone && <span className="text-[#565959]"> · {a.phone}</span>}
                  {a.is_default && <span className="ml-2 text-xs text-[#565959]">Default</span>}
                </span>
              </label>
            ))}
          </div>
          {adding ? (
            <div className="mt-3 space-y-3 rounded-lg border border-[#d5d9d9] p-3">
              <h3 className="font-bold">Add a new address</h3>
              <Field label="Full name"><input className={inputCls} value={draft.full_name} onChange={setD("full_name")} /></Field>
              <Field label="Address line 1"><input className={inputCls} value={draft.line1} onChange={setD("line1")} placeholder="Street address" /></Field>
              <Field label="Address line 2 (optional)"><input className={inputCls} value={draft.line2} onChange={setD("line2")} placeholder="Apt, suite, unit" /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="City"><input className={inputCls} value={draft.city} onChange={setD("city")} /></Field>
                <Field label="State"><input className={inputCls} value={draft.state} onChange={setD("state")} /></Field>
                <Field label="ZIP code"><input className={inputCls} value={draft.zip} onChange={setD("zip")} /></Field>
              </div>
              <Field label="Phone (optional)"><input className={inputCls} type="tel" value={draft.phone} onChange={setD("phone")} /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_default} onChange={(e) => setDraft((d) => ({ ...d, is_default: e.target.checked }))} className="accent-[#e77600]" />
                Make this my default address
              </label>
              {addrError && <p className="text-sm text-[#c40000]">{addrError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={saveAddress} disabled={saving} className={`${yellowBtn} px-4 py-1.5`}>
                  {saving ? "Saving..." : "Use this address"}
                </button>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-[#d5d9d9] px-4 py-1.5 text-sm hover:bg-[#f7fafa]">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="mt-3 text-sm text-[#007185] hover:text-[#c7511f] hover:underline">
              + Add a new address
            </button>
          )}
        </Section>

        <Section n={2} title="Payment method">
          <p className="mb-3 text-xs text-[#565959]">Demo checkout: no real payment is made and card details are never stored.</p>
          <div className="grid max-w-md gap-3">
            <Field label="Card number">
              <input className={inputCls} inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={card.number} onChange={setC("number", (v) => v.replace(/[^\d ]/g, "").slice(0, 23))} />
            </Field>
            <Field label="Name on card"><input className={inputCls} autoComplete="off" value={card.name} onChange={setC("name")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry (MM/YY)">
                <input className={inputCls} inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={card.expiry} onChange={setC("expiry", fmtExpiry)} />
              </Field>
              <Field label="Security code">
                <input className={inputCls} inputMode="numeric" autoComplete="off" placeholder="CVC" value={card.cvc} onChange={setC("cvc", (v) => v.replace(/\D/g, "").slice(0, 4))} />
              </Field>
            </div>
          </div>
        </Section>

        <Section n={3} title="Review items and delivery">
          <p className="mb-3 font-bold text-[#007600]">Estimated delivery: {deliveryWindow()}</p>
          <ul className="divide-y divide-[#e7e7e7]">
            {items.map((i) => (
              <li key={i.product_id} className="flex gap-3 py-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#f7f7f7]">
                  {i.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
                <div className="text-sm">
                  <p className="line-clamp-2 font-bold">{i.title}</p>
                  <p className="font-bold text-[#b12704]">{formatPrice(i.price)}</p>
                  <p className="text-[#565959]">Qty: {i.qty}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <aside className="rounded-lg border border-[#d5d9d9] bg-white p-4 lg:sticky lg:top-4">
        <button type="button" onClick={submit} disabled={placing} className={`${yellowBtn} w-full py-2`}>
          {placing ? "Placing order..." : "Place your order"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-[#c40000]">{error}</p>}
        <h2 className="mt-4 border-b border-[#e7e7e7] pb-2 text-lg font-bold">Order Summary</h2>
        <dl className="mt-2 space-y-1 text-sm">
          <Row label={`Items (${count}):`} value={formatPrice(totals.subtotal)} />
          <Row label="Shipping:" value={totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping)} />
          <Row label="Estimated tax:" value={formatPrice(totals.tax)} />
          <div className="mt-2 flex justify-between border-t border-[#e7e7e7] pt-2 text-lg font-bold text-[#b12704]">
            <dt>Order total:</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
