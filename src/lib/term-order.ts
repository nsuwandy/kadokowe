/**
 * Resolve the saved order of taxonomy terms — FR-10.4.
 *
 * The operator types a position against each row. Positions are read, sorted
 * and then renumbered from zero, so the two things people actually do both
 * work: typing "1" against a row far down the list to send it to the top,
 * and leaving gaps ("10, 20, 30") to make room. Duplicates keep their
 * existing relative order rather than being rejected — refusing a save
 * because two rows both say "3" would be pedantry, not safety.
 */
export function resolveTermOrder(
  ids: string[],
  rankOf: (id: string) => number | undefined,
): string[] {
  return ids
    .map((id, i) => {
      const typed = rankOf(id);
      const valid = typeof typed === "number" && Number.isFinite(typed);
      const rank = valid ? (typed as number) : i + 1;
      return {
        id,
        rank,
        // A row the operator actually retyped beats one that merely still
        // holds that number by default. Without this, typing "1" against a
        // row lands it second — behind the row already sitting at 1 — and
        // "type 1 to send it to the top" would be a promise the form breaks.
        moved: valid && rank !== i + 1 ? 0 : 1,
        tie: i,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.moved - b.moved || a.tie - b.tie)
    .map((r) => r.id);
}
