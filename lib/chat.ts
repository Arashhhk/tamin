/** Chat closes the moment a deal is marked completed either way. */
export const CHAT_AUTO_CLOSE_HOURS = 72;

/**
 * Chat closes as soon as either happens, whichever comes first:
 *   - the deal is marked "completed" (both sides confirmed delivery), or
 *   - CHAT_AUTO_CLOSE_HOURS have passed since a seller was selected,
 *     even if nobody ever confirmed anything.
 *
 * Used both to enforce sending (app/api/rfq/[id]/messages/route.ts)
 * and to drive the read-only UI state (app/rfq/[slug]/page.tsx) — one
 * function so the two can't quietly drift apart.
 */
export function isChatClosed(rfq: { status: string; selectedAt?: string | Date | null }): boolean {
  if (rfq.status === "completed") return true;
  if (!rfq.selectedAt) return false;
  const elapsedMs = Date.now() - new Date(rfq.selectedAt).getTime();
  return elapsedMs > CHAT_AUTO_CLOSE_HOURS * 3600 * 1000;
}
