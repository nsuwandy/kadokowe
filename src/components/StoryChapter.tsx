"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One chapter of a project story — FR-7.x.
 *
 * The background is pinned for the height of its own chapter and the text
 * travels over it, so each scroll lands on a new scene rather than a new
 * paragraph. Only the copy moves: animating the photograph as well turns six
 * chapters into a fairground ride, and the point is that the writing is read.
 *
 * The reveal is additive. The text is visible with no class at all, and the
 * class only plays it in — hiding it first and relying on JavaScript to
 * un-hide it would leave the whole article invisible to anyone whose script
 * did not run, which for a page that exists to be read is the worst failure
 * available. Motion is dropped in CSS for anyone who has asked for less of
 * it, so there is no second implementation of that rule here.
 *
 * Nothing hijacks the scroll: the page moves at the speed the visitor moves
 * it.
 */
export function StoryChapter({
  background,
  children,
}: {
  background: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Once played, it stays played. Replaying on scroll-up is the
          // behaviour that makes a long article feel broken.
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "-10% 0px -18% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative">
      {/* Pinned for exactly the height of this chapter, then released. */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">{background}</div>

      <div className="relative z-2 -mt-[100svh] flex min-h-[100svh] items-end">
        <div
          ref={ref}
          className={`w-full px-gutter pb-16 lg:pb-24 ${entered ? "kdk-rise" : ""}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
