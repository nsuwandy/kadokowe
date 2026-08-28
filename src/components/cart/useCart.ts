"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CART_STORAGE_KEY, addLine, readCart, writeCart, type CartLine,
} from "@/lib/cart";

/**
 * The cart, read straight from browser storage.
 *
 * Storage is the source of truth rather than a copy of React state. That
 * removes the mount-then-refill dance a stored value normally needs, and it
 * comes with a property worth having for free: two tabs open on the
 * catalogue stay in step, because the storage event is one of the things this
 * subscribes to. A cart that silently disagreed with itself across tabs would
 * be found by a customer, not by us.
 *
 * There is no provider. Nothing needs to wrap the site, and any component can
 * ask for the cart wherever it happens to be.
 */

const EMPTY: CartLine[] = [];

let cachedRaw: string | null = null;
let cached: CartLine[] = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab writing to storage.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * useSyncExternalStore compares snapshots by identity, so this has to hand
 * back the same array until the stored string actually changes — parsing
 * afresh each call would return a new array every render and loop forever.
 */
function getSnapshot(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readCart();
  }
  return cached;
}

/** Nothing is in the cart during the server render, by definition. */
const getServerSnapshot = () => EMPTY;

function commit(next: CartLine[]) {
  writeCart(next);
  cachedRaw = JSON.stringify(next);
  cached = next;
  emit();
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((entry: CartLine) => commit(addLine(getSnapshot(), entry)), []);
  const setQuantity = useCallback(
    (index: number, quantity: number) =>
      commit(
        getSnapshot().map((l, i) =>
          i === index ? { ...l, quantity: Math.max(1, quantity) } : l,
        ),
      ),
    [],
  );
  const remove = useCallback(
    (index: number) => commit(getSnapshot().filter((_, i) => i !== index)),
    [],
  );
  const clear = useCallback(() => commit([]), []);

  return {
    lines,
    add,
    setQuantity,
    remove,
    clear,
    count: lines.reduce((n, l) => n + l.quantity, 0),
  };
}
