"use client";

import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#f7f7f7] text-sm text-[#565959]">
        No image available
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex w-12 shrink-0 flex-col gap-2">
        {images.slice(0, 7).map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`Show image ${i + 1}`}
            className={`flex h-12 w-12 items-center justify-center rounded border bg-white p-0.5 ${
              i === active ? "border-[#e77600] shadow-[0_0_3px_2px_rgba(228,121,17,.5)]" : "border-[#888c8c]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
          </button>
        ))}
      </div>
      <div className="flex h-72 flex-1 items-center justify-center bg-white sm:h-[28rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}
