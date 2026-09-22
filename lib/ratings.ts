import User from "@/models/User";

/**
 * Folds one new star rating into a seller's running average.
 *
 * Uses `oldAverage*oldCount` to recover the running total rather than
 * storing every rating's stars in a running sum column — keeps
 * User's schema untouched (still just `rating` + `ratingCount`) while
 * staying accurate as long as this is the only path that ever writes
 * to `rating` (see models/Rating.ts's unique index on `rfq`, which
 * stops the same deal from being folded in twice).
 */
export async function applyRatingToSeller(sellerId: string, stars: number) {
  const seller = await User.findById(sellerId).select("rating ratingCount");
  if (!seller) return;

  const oldCount = seller.ratingCount ?? 0;
  const oldAverage = seller.rating ?? 0;
  const newCount = oldCount + 1;
  const newAverage = (oldAverage * oldCount + stars) / newCount;

  seller.rating = Math.round(newAverage * 10) / 10; // one decimal place
  seller.ratingCount = newCount;
  await seller.save();
}
