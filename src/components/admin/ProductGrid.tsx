"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { GRID_COLUMNS, emptyGridRow, type GridColumn } from "@/lib/product-grid";
import type { ImportState } from "@/lib/product-import";
import { importProductGrid } from "@/app/admin/products/grid/actions";

/**
 * Spreadsheet-style bulk entry — the second front end for FR-10.11.
 *
 * The CSV importer assumes the operator already has a spreadsheet. This one
 * assumes they do not: they are working from a supplier list, a photo folder,
 * or a conversation, and the catalogue is being written rather than
 * transferred. That is the likelier situation for the 150–250 launch products.
 *
 * The design point is that the fields with closed value sets are never typed.
 * `availability`, `visibility` and the three taxonomy axes are the columns a
 * CSV gets wrong, and a rejected row for a mis-typed enum is a wasted round
 * trip. Here they are dropdowns reading the same values the importer
 * validates against, so those errors cannot be made in the first place.
 *
 * Guidance is attached to the cursor rather than to a legend at the bottom of
 * the page. NFR-5.2 hands this to a non-technical operator with no support
 * agreement behind them (decision I16); a column guide they have to scroll
 * away from the table to read is a column guide they will not read.
 */

export type TermChoice = { slug: string; name: string };
export type TermsByAxis = Record<string, TermChoice[]>;

const STORAGE_KEY = "kadokowe.product-grid.v1";

/** Defined locally rather than imported: the shared constant lives beside the
 *  CSV parser, and importing it here would pull papaparse into the browser. */
const EMPTY_STATE: ImportState = {
  ran: false,
  imported: 0,
  issues: [],
  missingColumns: [],
};

type Row = Record<string, string>;
type Focus = { r: number; c: number };

const splitList = (v: string) =>
  v.split(/[|;]/).map((s) => s.trim()).filter(Boolean);

/**
 * Position a floating element against a cell.
 *
 * The grid scrolls sideways, and a scroll container clips its own children —
 * a tip or a dropdown positioned inside one is cut off at the edge of the
 * table. Both therefore render fixed to the viewport and are measured from the
 * cell they belong to, re-measuring on any scroll so they stay attached.
 */
function useAnchoredPosition(
  open: boolean,
  anchor: React.RefObject<HTMLElement | null>,
  size: { width: number; height: number },
) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchor.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const margin = 8;
      const left = Math.max(
        margin,
        Math.min(r.left, window.innerWidth - size.width - margin),
      );
      // Flip above the cell when the room below has run out, so the guidance
      // is never the thing that pushes the table off screen.
      const below = r.bottom + 4;
      const top =
        below + size.height > window.innerHeight - margin && r.top > size.height
          ? r.top - size.height - 4
          : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchor, size.width, size.height]);

  // The last measurement is kept rather than cleared on close: it is only read
  // while open, and clearing it would cost an extra render every time a cell
  // loses focus — which, in a grid, is on every keystroke that moves.
  return open ? pos : null;
}

/** The saved draft, or null when there is none this browser can read. */
function readDraft(): Row[] | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((r) => ({ ...emptyGridRow(), ...(r as Row) }));
  } catch {
    // Storage blocked, or a draft left by an older version of this page.
    return null;
  }
}

// A store that never changes: the snapshot simply differs between server and
// client, which is exactly the question being asked.
const noSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * The draft lives in this browser and cannot exist during the server render.
 *
 * Rather than mounting an empty grid and refilling it from an effect — which
 * flashes, and fights anyone who has already started typing — the editor is
 * held back until hydration is done, then created once with the saved rows
 * already in it.
 */
export function ProductGrid({ termsByAxis }: { termsByAxis: TermsByAxis }) {
  const hydrated = useSyncExternalStore(noSubscribe, onClient, onServer);
  if (!hydrated) return <div aria-hidden className="h-64 border border-line bg-paper" />;
  return <GridEditor termsByAxis={termsByAxis} />;
}

function GridEditor({ termsByAxis }: { termsByAxis: TermsByAxis }) {
  const [state, formAction, pending] = useActionState(importProductGrid, EMPTY_STATE);

  const [draft] = useState(readDraft);
  const [rows, setRows] = useState<Row[]>(
    () => draft ?? [emptyGridRow(), emptyGridRow(), emptyGridRow()],
  );
  const [showAll, setShowAll] = useState(false);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [restored, setRestored] = useState(draft !== null);

  const payloadRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const columns = showAll ? GRID_COLUMNS : GRID_COLUMNS.filter((c) => c.essential);

  /* ---------------------------------------------------------------- draft
     A half-typed catalogue is hours of work. It survives a reload, a closed
     tab and an accidental navigation — none of which the operator will
     expect to be safe unless it is. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      } catch {
        // Out of quota or storage disabled: not worth interrupting typing over.
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [rows]);

  /* ------------------------------------------------------------- editing */
  const setCell = useCallback((r: number, key: string, value: string) => {
    setRows((prev) => {
      const next = prev.slice();
      // Typing in the last row grows the table, the way a spreadsheet does.
      while (next.length <= r) next.push(emptyGridRow());
      next[r] = { ...next[r]!, [key]: value };
      if (r === next.length - 1 && value.trim() !== "") next.push(emptyGridRow());
      return next;
    });
  }, []);

  const addRows = (n: number) =>
    setRows((prev) => [...prev, ...Array.from({ length: n }, emptyGridRow)]);

  const deleteRow = (r: number) =>
    setRows((prev) => (prev.length <= 1 ? [emptyGridRow()] : prev.filter((_, i) => i !== r)));

  const duplicateRow = (r: number) =>
    setRows((prev) => [...prev.slice(0, r + 1), { ...prev[r]! }, ...prev.slice(r + 1)]);

  const clearAll = () => {
    setRows([emptyGridRow(), emptyGridRow(), emptyGridRow()]);
    setRestored(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up */
    }
  };

  /* ---------------------------------------------------------- navigation */
  const focusCell = (r: number, c: number) => {
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
  };

  const onCellKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    r: number,
    c: number,
  ) => {
    const el = e.currentTarget;
    const isText = el instanceof HTMLInputElement && el.type === "text";
    // Left and right only leave the cell once the caret has run out of text,
    // or editing a value becomes a fight with the grid.
    const atStart = !isText || (el.selectionStart === 0 && el.selectionEnd === 0);
    const atEnd =
      !isText ||
      (el.selectionStart === el.value.length && el.selectionEnd === el.value.length);

    if (e.key === "Enter" || (e.key === "ArrowDown" && !e.altKey)) {
      e.preventDefault();
      focusCell(r + 1, c);
    } else if (e.key === "ArrowUp" && !e.altKey) {
      e.preventDefault();
      if (r > 0) focusCell(r - 1, c);
    } else if (e.key === "ArrowLeft" && atStart && c > 0) {
      e.preventDefault();
      focusCell(r, c - 1);
    } else if (e.key === "ArrowRight" && atEnd && c < columns.length - 1) {
      e.preventDefault();
      focusCell(r, c + 1);
    }
  };

  /**
   * Paste a block copied out of Excel, Sheets or Numbers.
   *
   * Anything with a tab or a line break in it is a range, not a value, and is
   * written across the grid from the focused cell — which is the one thing an
   * operator will try within a minute of seeing a table like this.
   */
  const onCellPaste = (e: React.ClipboardEvent<HTMLElement>, r: number, c: number) => {
    const raw = e.clipboardData.getData("text/plain");
    if (!raw.includes("\t") && !raw.includes("\n")) return;
    e.preventDefault();

    const block = raw
      .replace(/\r\n?/g, "\n")
      .replace(/\n$/, "")
      .split("\n")
      .map((line) => line.split("\t"));

    setRows((prev) => {
      const next = prev.map((row) => ({ ...row }));
      block.forEach((cells, dr) => {
        const target = r + dr;
        while (next.length <= target) next.push(emptyGridRow());
        cells.forEach((value, dc) => {
          const col = columns[c + dc];
          if (!col) return;
          next[target]![col.key] = normalisePasted(col, value.trim());
        });
      });
      if (next[next.length - 1] && Object.values(next[next.length - 1]!).some((v) => v.trim() !== "")) {
        next.push(emptyGridRow());
      }
      return next;
    });
  };

  /* ------------------------------------------------------- what to report */
  const filled = rows.filter((r) => Object.values(r).some((v) => v.trim() !== ""));

  // Client-side checks mirror the server's, purely to save a round trip. The
  // importer re-runs all of them and is the one that decides.
  const slugsSeen = new Map<string, number>();
  const rowProblems = new Map<number, string>();
  rows.forEach((row, i) => {
    const any = Object.values(row).some((v) => v.trim() !== "");
    if (!any) return;
    if (!row.name_en?.trim()) {
      rowProblems.set(i, "Needs an English name.");
      return;
    }
    const slug = row.slug?.trim();
    if (slug) {
      const first = slugsSeen.get(slug);
      if (first !== undefined) rowProblems.set(i, `Same web address as row ${first + 1}.`);
      else slugsSeen.set(slug, i);
    }
  });

  const ready = filled.length - rowProblems.size;

  // Line numbers come back from the importer against the filled rows only, so
  // map them to positions in the grid the operator is actually looking at.
  const filledIndexes = rows.flatMap((r, i) =>
    Object.values(r).some((v) => v.trim() !== "") ? [i] : [],
  );
  const importIssueByRow = new Map<number, string>();
  for (const issue of state.issues) {
    const idx = filledIndexes[issue.line - 1];
    if (idx !== undefined) importIssueByRow.set(idx, issue.problem);
  }

  const rejected = state.issues.filter((i) => !i.problem.startsWith("Imported,"));
  const warnings = state.issues.filter((i) => i.problem.startsWith("Imported,"));

  return (
    <div className="flex flex-col gap-5">
      {/* ------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 bg-paper px-5 py-4">
        <span className="text-sm">
          <strong className="font-semibold">{ready}</strong>{" "}
          {ready === 1 ? "row is" : "rows are"} ready
          {rowProblems.size > 0 && (
            <span className="text-red">
              {" "}· {rowProblems.size} {rowProblems.size === 1 ? "needs" : "need"} attention
            </span>
          )}
        </span>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="accent-red"
          />
          Show all {GRID_COLUMNS.length} columns
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addRows(10)}
            className="border border-line px-4 py-2 text-xs font-semibold hover:border-ink"
          >
            + 10 rows
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="border border-line px-4 py-2 text-xs font-semibold text-muted hover:border-red hover:text-red"
          >
            Clear table
          </button>
        </div>
      </div>

      {restored && (
        <p className="border-l-2 border-line bg-paper px-5 py-3 text-xs text-muted">
          Picked up where you left off — this table is saved in this browser as
          you type, and is not sent anywhere until you press Import.
        </p>
      )}

      {/* ---------------------------------------------------------- grid */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="rows" ref={payloadRef} />

        <div className="overflow-x-auto border border-line bg-paper">
          <table ref={tableRef} className="w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-warm">
                <th className="sticky left-0 z-20 w-12 border-r border-line bg-warm px-2 py-2 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted">
                  Row
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.width }}
                    className="border-r border-line px-3 py-2 text-left align-bottom"
                  >
                    <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.1em]">
                      {col.label}
                      {col.required && <span className="text-red"> *</span>}
                    </span>
                    <span className="block font-mono text-[0.625rem] font-normal normal-case tracking-normal text-muted">
                      {col.key}
                    </span>
                  </th>
                ))}
                <th className="w-20 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => {
                const problem = rowProblems.get(r);
                const imported = importIssueByRow.get(r);
                return (
                  <tr
                    key={r}
                    className={
                      problem
                        ? "border-b border-line bg-red/5"
                        : "border-b border-line"
                    }
                  >
                    <th
                      scope="row"
                      title={problem ?? imported ?? undefined}
                      className={`sticky left-0 z-10 border-r border-line px-2 py-1 text-center font-mono text-[0.6875rem] tabular-nums ${
                        problem ? "bg-paper text-red" : "bg-paper text-muted"
                      }`}
                    >
                      {r + 1}
                    </th>

                    {columns.map((col, c) => (
                      <td key={col.key} className="border-r border-line p-0">
                        <GridCell
                          col={col}
                          value={row[col.key] ?? ""}
                          r={r}
                          c={c}
                          terms={col.axis ? (termsByAxis[col.axis] ?? []) : []}
                          onChange={(v) => setCell(r, col.key, v)}
                          onFocus={() => setFocus({ r, c })}
                          onBlur={() => setFocus((f) => (f?.r === r && f.c === c ? null : f))}
                          onKeyDown={(e) => onCellKeyDown(e, r, c)}
                          onPaste={(e) => onCellPaste(e, r, c)}
                          tipOpen={focus?.r === r && focus.c === c}
                        />
                      </td>
                    ))}

                    <td className="px-2 py-1 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => duplicateRow(r)}
                        title="Duplicate this row"
                        aria-label={`Duplicate row ${r + 1}`}
                        className="px-1.5 text-xs text-muted hover:text-ink"
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(r)}
                        title="Delete this row"
                        aria-label={`Delete row ${r + 1}`}
                        className="px-1.5 text-xs text-muted hover:text-red"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled={pending || ready === 0}
            onClick={() => {
              // Serialised here rather than on every keystroke: the click runs
              // before the browser submits, so the field is current.
              if (payloadRef.current) {
                payloadRef.current.value = JSON.stringify(
                  rows.filter((r) => Object.values(r).some((v) => v.trim() !== "")),
                );
              }
            }}
            className="bg-red px-7 py-3.5 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink disabled:opacity-50"
          >
            {pending ? "Importing…" : `Import ${ready} ${ready === 1 ? "product" : "products"}`}
          </button>
          <p className="text-xs text-muted">
            Rows are matched on web address — an existing product is updated
            rather than duplicated, so it is safe to fix a few rows and import
            again.
          </p>
        </div>
      </form>

      {/* -------------------------------------------------------- results */}
      {state.message && (
        <p role="alert" className="border-l-2 border-red bg-paper px-5 py-4 text-sm">
          {state.message}
        </p>
      )}

      {state.ran && !state.message && (
        <div className="bg-paper">
          <div className="border-l-2 border-red px-5 py-4">
            <p className="font-semibold">
              Imported {state.imported} {state.imported === 1 ? "product" : "products"}.
            </p>
            <p className="mt-1 text-sm text-muted">
              {rejected.length > 0
                ? `${rejected.length} ${rejected.length === 1 ? "row was" : "rows were"} skipped — they are still in the table below, marked in red.`
                : "Every row went in. Clear the table to start the next batch."}
              {warnings.length > 0 && ` ${warnings.length} imported with something to check.`}
            </p>
          </div>

          {[
            { title: "Rows that were skipped", items: rejected, tone: "text-red" },
            { title: "Imported, with something to check", items: warnings, tone: "text-muted" },
          ]
            .filter((s) => s.items.length > 0)
            .map((section) => (
              <section key={section.title} className="border-t border-line">
                <h3 className="px-5 pt-5 text-sm font-semibold">{section.title}</h3>
                <ul className="divide-y divide-line">
                  {section.items.map((issue, i) => (
                    <li key={`${issue.line}-${i}`} className="flex gap-4 px-5 py-3">
                      <span className={`shrink-0 font-mono text-xs tabular-nums ${section.tone}`}>
                        row {issue.line}
                      </span>
                      <span className="text-sm">
                        {issue.problem}
                        {issue.slug && (
                          <span className="ml-2 font-mono text-xs text-muted">({issue.slug})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

/** Excel writes TRUE/FALSE and human labels; the importer wants its own
 *  vocabulary. Pasted values are mapped where the intent is unambiguous. */
function normalisePasted(col: GridColumn, value: string): string {
  if (col.kind === "bool") {
    return ["1", "true", "yes", "y", "✓"].includes(value.toLowerCase()) ? "true" : "";
  }
  if (col.kind === "choice") {
    const upper = value.toUpperCase().replace(/[\s-]+/g, "_");
    const match = col.choices?.find(
      (o) => o.value === upper || o.label.toLowerCase() === value.toLowerCase(),
    );
    return match?.value ?? value;
  }
  return value;
}

/* ------------------------------------------------------------------ cell */

function GridCell({
  col,
  value,
  r,
  c,
  terms,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onPaste,
  tipOpen,
}: {
  col: GridColumn;
  value: string;
  r: number;
  c: number;
  terms: TermChoice[];
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLElement>) => void;
  tipOpen: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // The terms menu occupies the same space as the tip. Two panels anchored to
  // one cell overlap into an unreadable stack, so the tip stands down.
  const [menuOpen, setMenuOpen] = useState(false);
  const shared = {
    "data-cell": `${r}-${c}`,
    onFocus,
    onBlur,
    onKeyDown,
    onPaste,
    className:
      "w-full border-0 bg-transparent px-3 py-2 text-sm outline-none focus:bg-warm focus:ring-2 focus:ring-inset focus:ring-red",
  } as const;

  let control: React.ReactNode;

  if (col.kind === "bool") {
    control = (
      <div className="flex justify-center py-2">
        <input
          type="checkbox"
          data-cell={`${r}-${c}`}
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="h-4 w-4 accent-red outline-none focus:ring-2 focus:ring-red"
        />
      </div>
    );
  } else if (col.kind === "choice") {
    control = (
      <select
        {...shared}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {col.choices?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (col.kind === "term") {
    control = (
      <select {...shared} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {terms.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    );
  } else if (col.kind === "terms") {
    control = (
      <TermsCell
        value={value}
        terms={terms}
        cellId={`${r}-${c}`}
        onOpenChange={setMenuOpen}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    );
  } else {
    control = (
      <input
        {...shared}
        type="text"
        inputMode={col.kind === "number" ? "numeric" : undefined}
        value={value}
        title={value || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      {control}
      <CellTip col={col} open={tipOpen && !menuOpen} anchor={wrapRef} />
    </div>
  );
}

/**
 * The guidance that follows the cursor.
 *
 * Anchored to the cell and rendered above the row below it. It says what the
 * column expects and, where the format is not self-evident, what a real value
 * looks like — the two questions a column heading cannot answer on its own.
 */
const TIP_SIZE = { width: 288, height: 132 };

function CellTip({
  col,
  open,
  anchor,
}: {
  col: GridColumn;
  open: boolean;
  anchor: React.RefObject<HTMLElement | null>;
}) {
  const pos = useAnchoredPosition(open, anchor, TIP_SIZE);
  if (!pos) return null;

  return (
    <div
      role="note"
      style={{ position: "fixed", top: pos.top, left: pos.left, width: TIP_SIZE.width }}
      className="pointer-events-none z-40 border border-ink bg-ink px-4 py-3 text-warm shadow-lg"
    >
      <p className="font-display text-[0.625rem] font-bold uppercase tracking-[0.12em] text-red">
        {col.label}
        {col.required && " · required"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-plate-c">{col.hint}</p>
      {col.example && (
        <p className="mt-2 border-t border-[#3a3335] pt-2 font-mono text-[0.6875rem] text-warm">
          e.g. {col.example}
        </p>
      )}
    </div>
  );
}

const MENU_SIZE = { width: 256, height: 256 };

/** Multi-term picker. A native multiple-select is unusable in a grid — it
 *  needs a modifier key nobody discovers — so the options are checkboxes. */
function TermsCell({
  value,
  terms,
  cellId,
  onOpenChange,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  value: string;
  terms: TermChoice[];
  cellId: string;
  onOpenChange: (open: boolean) => void;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pos = useAnchoredPosition(open, buttonRef, MENU_SIZE);
  const chosen = splitList(value);
  const chosenSet = new Set(chosen);

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (slug: string) => {
    const next = chosenSet.has(slug)
      ? chosen.filter((s) => s !== slug)
      : [...chosen, slug];
    onChange(next.join(" | "));
  };

  const label = chosen
    .map((slug) => terms.find((t) => t.slug === slug)?.name ?? slug)
    .join(", ");

  return (
    <div ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        data-cell={cellId}
        onClick={() => setOpen((o) => !o)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === " " || (e.key === "Enter" && !open)) {
            e.preventDefault();
            setOpen(true);
            return;
          }
          onKeyDown(e);
        }}
        aria-expanded={open}
        title={label || undefined}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none focus:bg-warm focus:ring-2 focus:ring-inset focus:ring-red"
      >
        <span className={`flex-1 truncate ${chosen.length ? "" : "text-muted"}`}>
          {label || "—"}
        </span>
        {chosen.length > 0 && (
          <span className="shrink-0 bg-red px-1.5 text-[0.625rem] font-bold text-paper tabular-nums">
            {chosen.length}
          </span>
        )}
      </button>

      {open && pos && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_SIZE.width }}
          className="z-50 max-h-64 overflow-y-auto border border-line bg-paper py-1 shadow-lg"
        >
          {terms.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">
              No terms yet — add them on the Categories page.
            </p>
          )}
          {terms.map((t) => (
            <label
              key={t.slug}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hover:bg-warm"
            >
              <input
                type="checkbox"
                checked={chosenSet.has(t.slug)}
                onChange={() => toggle(t.slug)}
                className="accent-red"
              />
              {t.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
