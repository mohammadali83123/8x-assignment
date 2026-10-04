import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT, TAX_RATE } from "@/lib/format";

export type Totals = { subtotal: number; shipping: number; tax: number; total: number };

const round = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(lines: { price: number; qty: number }[]): Totals {
  const subtotal = round(lines.reduce((sum, l) => sum + l.price * l.qty, 0));
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: round(subtotal + shipping + tax) };
}

/** Estimated delivery window: 3 to 5 days from the given date. */
export function deliveryWindow(from = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
  const day = (n: number) => fmt.format(new Date(from.getTime() + n * 86_400_000));
  return `${day(3)} - ${day(5)}`;
}
