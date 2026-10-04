import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT, TAX_RATE } from "@/lib/format";

const round = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(items: { price: number; qty: number }[]) {
  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: round(subtotal + shipping + tax) };
}
