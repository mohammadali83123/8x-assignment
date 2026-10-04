"use client";

import { useOptimistic, useTransition } from "react";
import { moveToCart, removeItem, saveForLater, updateQty } from "@/app/cart/actions";

const linkBtn = "text-xs text-[#007185] hover:text-[#c7511f] hover:underline disabled:opacity-50";

export type CartActionLabels = {
  qty: string;
  quantity: string;
  zeroDelete: string;
  delete: string;
  moveToCart: string;
  saveForLater: string;
};

export function CartItemActions({
  productId,
  qty,
  maxQty,
  saved = false,
  labels,
}: {
  productId: number;
  qty: number;
  maxQty: number;
  saved?: boolean;
  labels: CartActionLabels;
}) {
  const [pending, start] = useTransition();
  const [optimisticQty, setOptimisticQty] = useOptimistic(qty);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {!saved && (
        <>
          <label className="flex items-center gap-1 rounded-lg border border-[#d5d9d9] bg-[#f0f2f2] px-2 py-0.5 text-sm shadow-sm">
            {labels.qty}
            <select
              value={optimisticQty}
              disabled={pending}
              onChange={(e) => {
                const next = Number(e.target.value);
                start(async () => {
                  setOptimisticQty(next);
                  await updateQty(productId, next);
                });
              }}
              className="bg-transparent font-medium outline-none"
              aria-label={labels.quantity}
            >
              <option value={0}>{labels.zeroDelete}</option>
              {Array.from({ length: Math.max(maxQty, qty) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span className="text-[#d5d9d9]">|</span>
        </>
      )}
      <button className={linkBtn} disabled={pending} onClick={() => start(() => removeItem(productId))}>
        {labels.delete}
      </button>
      <span className="text-[#d5d9d9]">|</span>
      <button
        className={linkBtn}
        disabled={pending}
        onClick={() => start(() => (saved ? moveToCart(productId) : saveForLater(productId)))}
      >
        {saved ? labels.moveToCart : labels.saveForLater}
      </button>
    </div>
  );
}
