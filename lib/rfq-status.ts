import Rfq from "@/models/Rfq";
import type { RfqStatus } from "@/models/Rfq";

/**
 * Single source of truth for "is this auction still open?".
 *
 * An RFQ is only OPEN (biddable, listable, counted publicly) while BOTH are true:
 *   1. status === "active"  — the buyer hasn't picked a seller / cancelled, and
 *   2. expiresAt > now      — its time hasn't run out.
 *
 * Previously every listing/count/detail check looked only at `status`, and
 * nothing ever flipped `status` when `expiresAt` passed — so timed-out
 * auctions stayed "active" forever and kept showing up in /rfq, category
 * pages, the homepage, seller dashboard, sitemap and counts. Every public
 * read now goes through `openRfqFilter()`, and `expireOverdueRfqs()` also
 * persists the real status so dashboards/admin stats stay truthful.
 */
export function openRfqFilter(now: Date = new Date()) {
  return { status: "active" as const, expiresAt: { $gt: now } };
}

/** True if an RFQ with this stored status/expiry can still take bids or be listed. */
export function isRfqOpen(status: string, expiresAt: Date | string | null | undefined, now = Date.now()) {
  if (status !== "active") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > now;
}

/** Stored status, except an "active" RFQ whose time is up reads as "expired". */
export function effectiveRfqStatus(
  status: RfqStatus,
  expiresAt: Date | string | null | undefined,
  now = Date.now()
): RfqStatus {
  if (status === "active" && !isRfqOpen(status, expiresAt, now)) return "expired";
  return status;
}

// Sweeps at most once per SWEEP_INTERVAL_MS per server instance — the
// updateMany itself is idempotent and index-backed (status + expiresAt),
// so running it on several instances at once is harmless.
const SWEEP_INTERVAL_MS = 30_000;
let lastSweepAt = 0;

/**
 * Persists status:"expired" on every active RFQ whose time has run out.
 * Lazy (runs when data is read) instead of needing a cron job. Never
 * throws: correctness of what users SEE doesn't depend on this — every
 * query also filters by expiresAt via openRfqFilter() — it only keeps the
 * stored status (admin stats, buyer dashboard) in sync.
 */
export async function expireOverdueRfqs(force = false) {
  const now = Date.now();
  if (!force && now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  try {
    await Rfq.updateMany(
      { status: "active", expiresAt: { $lte: new Date(now) } },
      { $set: { status: "expired" } }
    );
  } catch (err) {
    lastSweepAt = 0; // retry on next read
    console.error("expireOverdueRfqs failed:", err);
  }
}
