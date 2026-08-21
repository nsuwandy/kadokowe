"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Untranslated-content indicator — FR-11.4.
 *
 * The requirement is that both languages are edited from one interface "with
 * untranslated content clearly indicated". Every editor already puts the
 * English and Indonesian fields side by side, so what was missing was the
 * indication: with a dozen paired fields per form, an empty Indonesian box
 * reads as one more empty box rather than as work outstanding.
 *
 * It works by pairing fields on their names — `titleEn` with `titleId` — so
 * one component covers every editor and a new field is included the moment it
 * is added, with no register step to forget. The alternative, a wrapper around
 * each Indonesian input, needs eleven edits per form and quietly stops being
 * true the first time someone adds a twelfth field.
 *
 * A field counts as untranslated only when its English counterpart has
 * content: a pair that is empty on both sides is not missing a translation,
 * it is simply unused, and flagging it would train the operator to ignore
 * this panel.
 */
export function TranslationStatus() {
  const anchor = useRef<HTMLDivElement>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    const scan = () => {
      const found: string[] = [];
      for (const field of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input[name$="Id"], textarea[name$="Id"]',
      )) {
        // `termId` and similar identifiers end in "Id" without being a
        // language pair; requiring a matching *En field excludes them.
        const english = form.querySelector<HTMLInputElement>(
          `[name="${field.name.slice(0, -2)}En"]`,
        );
        if (!english) continue;
        if (english.value.trim() && !field.value.trim()) {
          found.push(labelFor(field) ?? field.name);
        }
      }
      setMissing(found);
    };

    scan();
    form.addEventListener("input", scan);
    return () => form.removeEventListener("input", scan);
  }, []);

  return (
    <div ref={anchor}>
      {missing.length > 0 && (
        <div
          role="status"
          className="border-l-2 border-red bg-paper px-5 py-4 text-sm"
        >
          <p className="font-semibold">
            {missing.length} {missing.length === 1 ? "field has" : "fields have"} no
            Indonesian translation
          </p>
          <p className="mt-1 text-xs text-muted">
            {missing.join(" · ")}
          </p>
          <p className="mt-2 max-w-[70ch] text-xs text-muted">
            You can save without them — the site falls back to English rather
            than showing a gap. This is a list of what is still in one language.
          </p>
        </div>
      )}
    </div>
  );
}

/** The visible label, so the panel names fields the way the form does. */
function labelFor(field: HTMLElement): string | null {
  const wrapper = field.closest("label");
  const text = wrapper?.querySelector("span")?.textContent?.trim();
  if (text) return text.replace(/\s*\*$/, "");
  return field.getAttribute("aria-label");
}
