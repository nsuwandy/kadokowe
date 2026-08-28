"use client";

import { useEffect, useState } from "react";

/**
 * The homepage hero, faded from one photograph to the next — FR-2.2.
 *
 * The slides are passed in as children rather than as image IDs, so the
 * images themselves stay server-rendered: this component decides which one is
 * visible and nothing else.
 *
 * There are no controls and no indicators. This is the backdrop to a
 * headline, not a gallery — anything to click here competes with the two
 * buttons that are the actual point of the section. It also stops entirely
 * for anyone who has asked their system to reduce motion, and never starts
 * when there is only one photograph to show.
 */
export function HeroRotator({
  slides,
  intervalMs = 6500,
}: {
  slides: React.ReactNode[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(
      () => setIndex((n) => (n + 1) % slides.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className="relative h-full w-full">
      {slides.map((slide, n) => (
        <div
          key={n}
          aria-hidden={n !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            n === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide}
        </div>
      ))}
    </div>
  );
}
