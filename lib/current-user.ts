import { connectToDatabase } from "./mongodb";
import { getSession } from "./auth";
import { isEffectivelySuspended } from "./violations";
import User from "@/models/User";

/**
 * `LeanUser` is derived directly from Mongoose's own inferred return
 * type for this exact query — NOT hand-reconstructed.
 *
 * Two earlier, wrong attempts at this:
 *   1. `FlattenMaps<IUser> & { _id: Types.ObjectId }` — a plain
 *      intersection merges rather than overrides, so it produced
 *      `FlattenMaps<unknown> & ObjectId` for `_id`.
 *   2. Deriving via ReturnType (this file's current approach) alone —
 *      still failed, because the REAL root cause was upstream: `IUser`
 *      itself `extends Document`, and Document's `_id` is `unknown`.
 *      That `unknown` propagated into every `.lean()` result no matter
 *      how the type was captured downstream.
 *
 * The actual fix is in models/User.ts: IUser no longer extends
 * Document. Mongoose adds `_id: Types.ObjectId` correctly on its own —
 * to both the hydrated (`.save()` etc. available) and `.lean()` (plain
 * object) shapes — once the raw interface stops fighting it. This
 * ReturnType derivation is kept because it's still the right way to
 * capture "whatever this query actually returns" without duplicating
 * Mongoose's inference by hand.
 */
async function fetchUserById(id: string) {
  return User.findById(id).lean();
}
export type LeanUser = NonNullable<Awaited<ReturnType<typeof fetchUserById>>>;

/**
 * Resolves the current session into a full user document.
 * Returns null if not logged in or the user no longer exists.
 */
export async function getCurrentUser(): Promise<LeanUser | null> {
  const session = await getSession();
  if (!session) return null;

  await connectToDatabase();
  const user = await fetchUserById(session.userId);
  if (!user) return null;
  // Treat permanently AND temporarily (strike 2) suspended accounts as
  // logged out everywhere — same effect, different duration.
  if (isEffectivelySuspended(user)) return null;
  return user;
}
