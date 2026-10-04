"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  headline: string;
  sub: string;
  cta: string;
  href: string;
  gradient: string;
  image: string | null;
};

export type HeroLabels = { prev: string; next: string; goTo: string };

export function HeroCarousel({ slides, labels }: { slides: HeroSlide[]; labels: HeroLabels }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [paused, count]);

  const go = (i: number) => setIndex((i + count) % count);

  return (
    <div
      className="relative h-[280px] overflow-hidden sm:h-[380px] lg:h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="relative flex h-full w-full shrink-0 items-start justify-between gap-6 px-8 pt-10 sm:px-16 sm:pt-16 lg:px-28 lg:pt-24"
            style={{ backgroundImage: slide.gradient }}
            aria-hidden={i !== index}
          >
            <div className="max-w-xl text-white">
              <h2 className="text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">{slide.headline}</h2>
              <p className="mt-2 text-sm sm:mt-3 sm:text-lg">{slide.sub}</p>
              <Link
                href={slide.href}
                tabIndex={i === index ? 0 : -1}
                className="mt-4 inline-block rounded-full bg-[#ffd814] px-5 py-2 text-sm font-medium text-[#0f1111] hover:bg-[#f7ca00] sm:mt-6"
              >
                {slide.cta}
              </Link>
            </div>
            {slide.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.image}
                alt=""
                className="hidden h-44 w-44 rounded-lg bg-white/90 object-contain p-3 shadow-xl sm:block lg:h-72 lg:w-72"
              />
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#eaeded] to-transparent" />

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={labels.prev}
            onClick={() => go(index - 1)}
            className="absolute left-2 top-24 hidden h-24 w-12 items-center justify-center rounded text-4xl text-white/90 hover:bg-black/20 sm:flex lg:top-40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={() => go(index + 1)}
            className="absolute right-2 top-24 hidden h-24 w-12 items-center justify-center rounded text-4xl text-white/90 hover:bg-black/20 sm:flex lg:top-40"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-16 flex justify-center gap-2 lg:bottom-52">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={labels.goTo.replace("{n}", String(i + 1))}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
