/**
 * A single "امتیاز اعتبار" (trust score, 0–100) for any profile —
 * buyer or seller alike — combining two signals that already exist on
 * every User: the star rating they've received (lib/ratings.ts) and
 * how many deals they've actually completed (incremented in
 * app/api/rfq/[id]/delivery/route.ts for both sides of a deal).
 *
 * Weighting: rating carries most of the score (70 of 100 points)
 * since it reflects actual reported experience, not just activity —
 * but only once someone has at least one rating; with zero ratings
 * that component is 0 rather than assuming average trust. Deal volume
 * contributes up to 30 points and saturates at 100 completed deals
 * (`Math.min(dealsCompleted, 100)`), so it keeps rewarding activity
 * early on without letting an extremely high deal count alone imply
 * near-perfect trust — the rating component is what earns the
 * remaining trust.
 *
 * This intentionally treats buyers and sellers identically: a buyer
 * who has never been rated (nothing currently rates buyers) simply
 * scores purely on completed-purchase volume, which is still a
 * meaningful, real signal on its own.
 */
export function computeTrustScore({
  rating,
  ratingCount,
  dealsCompleted
}: {
  rating: number;
  ratingCount: number;
  dealsCompleted: number;
}): number {
  const ratingComponent = ratingCount > 0 ? (rating / 5) * 70 : 0;
  const volumeComponent = (Math.min(dealsCompleted, 100) / 100) * 30;
  return Math.round(ratingComponent + volumeComponent);
}

export function trustScoreLabel(score: number): string {
  if (score >= 80) return "عالی";
  if (score >= 50) return "خوب";
  if (score >= 20) return "رو به رشد";
  return "تازه‌کار";
}
