"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { Price } from "@/components/product/Price";
import { addToCart, buyNow } from "@/app/dp/[id]/actions";

type Props = {
  productId: number;
  price: number;
  listPrice: number | null;
  stock: number;
  isPrime: boolean;
  delivery: string;
  seller: string;
};

export function BuyBox({ productId, price, listPrice, stock, isPrime, delivery, seller }: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const maxQty = Math.min(10, stock);

  function run(kind: "add" | "buy") {
    setError(null);
    startTransition(async () => {
      const result = await (kind === "add" ? addToCart : buyNow)(productId, qty);
      if (result && !result.ok) setError(result.error);
      else if (kind === "add") setAdded(true);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-[#d5d9d9] bg-white p-4 text-sm">
      <Price price={price} listPrice={listPrice} size="lg" />
      <p className="text-[#565959]">
        {isPrime && <span className="font-bold italic text-[#00a8e1]">prime </span>}
        FREE delivery <span className="font-bold text-[#0f1111]">{delivery}</span>
      </p>
      {stock > 0 ? (
        <>
          <p className={`text-lg ${stock <= 5 ? "text-[#b12704]" : "text-[#007600]"}`}>
            {stock <= 5 ? `Only ${stock} left in stock - order soon.` : "In Stock"}
          </p>
          <label className="flex items-center gap-2">
            Quantity:
            <select
              value={qty}
              onChange={(e) => {
                setQty(Number(e.target.value));
                setAdded(false);
              }}
              className="rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2 py-1 shadow-sm"
            >
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          {added ? (
            <div className="rounded-lg border border-[#067d62] bg-[#f0fff4] p-3">
              <p className="text-base font-bold text-[#067d62]">Added to Cart</p>
              <div className="mt-2 flex gap-2">
                <Link
                  href="/cart"
                  className="flex-1 rounded-full border border-[#d5d9d9] bg-white py-1.5 text-center hover:bg-[#f7fafa]"
                >
                  Go to Cart
                </Link>
                <Link href="/checkout" className="flex-1 rounded-full bg-[#ffd814] py-1.5 text-center hover:bg-[#f7ca00]">
                  Checkout
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run("add")}
                className="w-full rounded-full bg-[#ffd814] py-2 hover:bg-[#f7ca00] disabled:opacity-60"
              >
                Add to Cart
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run("buy")}
                className="w-full rounded-full bg-[#ffa41c] py-2 hover:bg-[#fa8900] disabled:opacity-60"
              >
                Buy Now
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-[#b12704]">
              {error}
            </p>
          )}
        </>
      ) : (
        <p className="text-lg text-[#b12704]">Currently unavailable.</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-[#565959]">
        <dt className="flex items-center gap-1">
          <Lock size={12} />
          Payment
        </dt>
        <dd className="text-[#007185]">Secure transaction</dd>
        <dt>Ships from</dt>
        <dd className="text-[#0f1111]">Amazon</dd>
        <dt>Sold by</dt>
        <dd className="text-[#0f1111]">{seller}</dd>
      </dl>
    </div>
  );
}
