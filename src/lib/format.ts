const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const formatPrice = (n: number) => usd.format(n);

/** Split a price into whole dollars and cents for Amazon-style superscript rendering. */
export function splitPrice(n: number) {
  const [whole, cents] = n.toFixed(2).split(".");
  return { whole: Number(whole).toLocaleString("en-US"), cents };
}

export const percentOff = (price: number, list: number | null) =>
  list && list > price ? Math.round(((list - price) / list) * 100) : 0;

export const FREE_SHIPPING_THRESHOLD = 35;
export const SHIPPING_FLAT = 5.99;
export const TAX_RATE = 0.08;
