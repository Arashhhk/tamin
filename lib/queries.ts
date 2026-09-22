import { connectToDatabase } from "./mongodb";
import Rfq from "@/models/Rfq";
import Category from "@/models/Category";
import User from "@/models/User";
import Bid from "@/models/Bid";

// Every function here is server-only (called from Server Components / Route
// Handlers). They centralize the "public listings only show status:'active'"
// rule so no page can accidentally leak an in-progress/completed RFQ.

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export async function getCategories() {
  await connectToDatabase();
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  const withCounts = await Promise.all(
    categories.map(async (c) => ({
      id: String(c._id),
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      parent: c.parent ? String(c.parent) : null,
      rfqCount: await Rfq.countDocuments({ category: c._id, status: "active" })
    }))
  );
  return withCounts;
}

/**
 * Two-level category tree: parent categories with their subcategories,
 * each carrying its own active-RFQ count. A parent's rfqCount is a
 * rollup (its own count + every child's count) so "دسته‌بندی‌های محبوب"
 * and the header/footer can show one meaningful number per parent.
 */
export async function getCategoryTree() {
  await connectToDatabase();
  const all = await Category.find().sort({ name: 1 }).lean();
  const parents = all.filter((c) => !c.parent);

  const rfqCounts = await Rfq.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  const countMap = new Map(rfqCounts.map((r: any) => [String(r._id), r.count as number]));

  return parents.map((p) => {
    const children = all
      .filter((c) => c.parent && String(c.parent) === String(p._id))
      .map((c) => ({
        id: String(c._id),
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        rfqCount: countMap.get(String(c._id)) ?? 0
      }));
    const ownCount = countMap.get(String(p._id)) ?? 0;
    const rfqCount = ownCount + children.reduce((sum, c) => sum + c.rfqCount, 0);
    return { id: String(p._id), slug: p.slug, name: p.name, icon: p.icon, rfqCount, children };
  });
}

export async function getParentCategories() {
  const tree = await getCategoryTree();
  return tree.map(({ children, ...rest }) => rest);
}

export async function getCategoryBySlug(slug: string) {
  await connectToDatabase();
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) return null;

  // A category is a "branch" (show subcategory list) if it HAS
  // children, and a "leaf" (show RFQ cards) if it doesn't — checked by
  // an actual query for children, NOT by whether it has a parent.
  // The old logic used `!cat.parent`, which only correctly handled a
  // flat 2-level tree: a category with a parent that ALSO had its own
  // children (a 3rd level) would incorrectly be treated as a leaf and
  // skip straight to an (empty) RFQ list instead of drilling down
  // further. This now works for a tree of any depth.
  const kids = await Category.find({ parent: cat._id }).sort({ name: 1 }).lean();
  const isParent = kids.length > 0;

  // Each child card shows either "N زیردسته" (if it's a branch itself)
  // or "N درخواست فعال" (if it's a leaf) — a shallow, cheap check, not
  // a full recursive rollup, which keeps this fast regardless of tree
  // depth while still telling the visitor what clicking it leads to.
  const children = await Promise.all(
    kids.map(async (k) => {
      const grandchildCount = await Category.countDocuments({ parent: k._id });
      const rfqCount =
        grandchildCount === 0 ? await Rfq.countDocuments({ category: k._id, status: "active" }) : 0;
      return {
        id: String(k._id),
        slug: k.slug,
        name: k.name,
        icon: k.icon,
        isBranch: grandchildCount > 0,
        count: grandchildCount > 0 ? grandchildCount : rfqCount
      };
    })
  );

  let parentInfo: { slug: string; name: string } | null = null;
  if (cat.parent) {
    const p = await Category.findById(cat.parent).lean();
    if (p) parentInfo = { slug: p.slug, name: p.name };
  }

  return {
    id: String(cat._id),
    slug: cat.slug,
    name: cat.name,
    icon: cat.icon,
    isParent,
    children,
    parent: parentInfo
  };
}

function toRfqCard(r: any) {
  return {
    id: String(r._id),
    slug: r.slug,
    title: r.title,
    description: r.description,
    categorySlug: r.category?.slug ?? "",
    quantity: r.quantity,
    unit: r.unit,
    province: r.province,
    city: r.city,
    status: r.status,
    selectedBid: r.selectedBid ? String(r.selectedBid) : null,
    bidsCount: r.bidsCount ?? 0,
    lowestBid: r.lowestBid ?? undefined,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
    expiresAt: r.expiresAt?.toISOString?.() ?? r.expiresAt,
    buyer: r.buyer
      ? { id: String(r.buyer._id ?? r.buyer), name: r.buyer.name ?? "" }
      : undefined
  };
}

async function attachBidStats(rfqs: any[]) {
  const ids = rfqs.map((r) => r._id);
  const stats = await Bid.aggregate([
    { $match: { rfq: { $in: ids } } },
    { $group: { _id: "$rfq", count: { $sum: 1 }, min: { $min: "$price" } } }
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return rfqs.map((r) => ({
    ...r,
    bidsCount: map.get(String(r._id))?.count ?? 0,
    lowestBid: map.get(String(r._id))?.min ?? undefined
  }));
}

export async function getActiveRfqs(opts: { limit?: number; categorySlug?: string; province?: string } = {}) {
  await connectToDatabase();
  const query: any = { status: "active" };

  if (opts.categorySlug) {
    const cat = await Category.findOne({ slug: opts.categorySlug }).lean();
    if (!cat) return [];
    if (!cat.parent) {
      // Parent category: include RFQs tagged directly on the parent
      // (rare) plus every one of its subcategories.
      const childIds = await Category.find({ parent: cat._id }).distinct("_id");
      query.category = { $in: [cat._id, ...childIds] };
    } else {
      query.category = cat._id;
    }
  }
  if (opts.province) query.province = opts.province;

  const rfqs = await Rfq.find(query)
    .populate("category", "slug")
    .populate("buyer", "name")
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .lean();

  const withStats = await attachBidStats(rfqs);
  return withStats.map(toRfqCard);
}

export async function getRfqBySlug(slug: string) {
  await connectToDatabase();
  const rfq = await Rfq.findOne({ slug }).populate("category", "slug").populate("buyer", "name").lean();
  if (!rfq) return null;
  const [withStats] = await attachBidStats([rfq]);
  return toRfqCard(withStats);
}

export async function getAllRfqsForAdmin() {
  await connectToDatabase();
  const rfqs = await Rfq.find()
    .populate("category", "slug name")
    .populate("buyer", "name")
    .sort({ createdAt: -1 })
    .lean();
  const withStats = await attachBidStats(rfqs);
  return withStats.map(toRfqCard);
}

export async function getTopSellers(limit = 3) {
  await connectToDatabase();
  const sellers = await User.find({
    role: "seller",
    status: "active",
    // Strike 1 consequence: excluded from this ranking while penalized.
    $or: [{ visibilityPenalizedUntil: null }, { visibilityPenalizedUntil: { $lt: new Date() } }]
  })
    .sort({ rating: -1, dealsCompleted: -1 })
    .limit(limit)
    .lean();
  return sellers.map((s) => ({
    id: String(s._id),
    name: s.name,
    role: "seller" as const,
    rating: s.rating,
    ratingCount: s.ratingCount,
    dealsCompleted: s.dealsCompleted,
    verified: s.verified,
    city: s.city
  }));
}

export async function getTopBuyers(limit = 3) {
  await connectToDatabase();
  // Buyers aren't rated by anyone yet (only buyer -> seller rating
  // exists today — see components/RatingForm.tsx), so ranking is by
  // completed-purchase volume; the `rating` tiebreak is a no-op now
  // but starts working automatically if a seller -> buyer rating flow
  // is ever added later, with no change needed here.
  const buyers = await User.find({ role: "buyer", status: "active" })
    .sort({ dealsCompleted: -1, rating: -1 })
    .limit(limit)
    .lean();
  return buyers.map((b) => ({
    id: String(b._id),
    name: b.name,
    role: "buyer" as const,
    rating: b.rating,
    ratingCount: b.ratingCount,
    dealsCompleted: b.dealsCompleted,
    verified: b.verified,
    city: b.city
  }));
}

export async function getAllUsersForAdmin() {
  await connectToDatabase();
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map((u) => {
    const tempActive = Boolean(u.tempSuspendedUntil && u.tempSuspendedUntil > new Date());
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      city: u.city,
      province: u.province,
      rating: u.rating,
      dealsCompleted: u.dealsCompleted,
      verified: u.verified,
      status: u.status ?? "active",
      effectiveStatus: u.status === "suspended" || tempActive ? "suspended" : "active",
      isTempSuspension: u.status !== "suspended" && tempActive,
      strikeCount: u.strikeCount ?? 0,
      tempSuspendedUntil: u.tempSuspendedUntil ? u.tempSuspendedUntil.toISOString() : null,
      banReviewPending: u.banReviewPending ?? false,
      joinedAt: u.createdAt?.toISOString?.() ?? u.createdAt
    };
  });
}

export async function getPlatformStats() {
  await connectToDatabase();
  const [totalRfqs, activeRfqs, totalSellers, completedRfqs] = await Promise.all([
    Rfq.countDocuments({}),
    Rfq.countDocuments({ status: "active" }),
    User.countDocuments({ role: "seller" }),
    Rfq.countDocuments({ status: "completed" })
  ]);
  return { totalRfqs, activeRfqs, totalSellers, successfulDeals: completedRfqs };
}

export async function getRfqStatusBreakdown() {
  await connectToDatabase();
  const rows = await Rfq.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const labels: Record<string, string> = {
    active: "در حال مزایده",
    selecting: "در حال انتخاب",
    in_progress: "در حال انجام",
    completed: "پایان یافته",
    expired: "منقضی شده",
    cancelled: "لغو شده"
  };
  const order = ["active", "selecting", "in_progress", "completed", "expired", "cancelled"];
  const map = new Map(rows.map((r: any) => [r._id, r.count]));
  return order
    .filter((s) => map.has(s))
    .map((s) => ({ status: s, label: labels[s], count: map.get(s) as number }));
}

export async function getUserRoleBreakdown() {
  await connectToDatabase();
  const rows = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  const labels: Record<string, string> = { buyer: "خریدار", seller: "فروشنده", admin: "ادمین" };
  return rows.map((r: any) => ({ role: r._id, label: labels[r._id] ?? r._id, count: r.count }));
}

export async function getTopCategoriesByRfqCount(limit = 6) {
  const categories = await getCategories();
  return [...categories].sort((a, b) => b.rfqCount - a.rfqCount).slice(0, limit);
}

export async function getRfqsPerDay(days = 14) {
  await connectToDatabase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await Rfq.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    }
  ]);
  const map = new Map(rows.map((r: any) => [r._id, r.count]));

  const result: { date: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({
      date: key,
      label: d.toLocaleDateString("fa-IR", { day: "2-digit", month: "2-digit" }),
      count: map.get(key) ?? 0
    });
  }
  return result;
}

export async function getBuyerRfqs(buyerId: string) {
  await connectToDatabase();
  const rfqs = await Rfq.find({ buyer: buyerId }).populate("category", "slug").sort({ createdAt: -1 }).lean();
  const withStats = await attachBidStats(rfqs);
  return withStats.map(toRfqCard);
}

export async function getSellerBidHistory(sellerId: string) {
  await connectToDatabase();
  const bids = await Bid.find({ seller: sellerId })
    .populate({ path: "rfq", select: "title slug status" })
    .sort({ createdAt: -1 })
    .lean();
  return bids.map((b: any) => ({
    id: String(b._id),
    rfqTitle: b.rfq?.title ?? "(حذف‌شده)",
    rfqSlug: b.rfq?.slug,
    price: b.price,
    note: b.note,
    status: b.status,
    createdAt: b.createdAt?.toISOString?.() ?? b.createdAt
  }));
}

export async function getBidsForViewer(
  rfqId: string,
  rfqBuyerId: string,
  selectedBidId: string | null | undefined,
  viewer: { id: string; role: string } | null
) {
  await connectToDatabase();
  const bids = await Bid.find({ rfq: rfqId })
    .populate("seller", "name city province")
    .sort({ price: 1 })
    .lean();

  const isBuyerOwner = viewer?.role === "buyer" && viewer.id === rfqBuyerId;

  return bids.map((bid: any) => {
    const isSelected = selectedBidId && String(bid._id) === String(selectedBidId);
    const isOwnBid = viewer?.role === "seller" && String(bid.seller._id) === viewer.id;
    const canSeeSellerIdentity = (isSelected && isBuyerOwner) || isOwnBid;

    return {
      id: String(bid._id),
      price: bid.price,
      note: bid.note,
      status: bid.status,
      createdAt: bid.createdAt?.toISOString?.() ?? bid.createdAt,
      isOwnBid,
      seller: canSeeSellerIdentity
        ? { id: String(bid.seller._id), name: bid.seller.name, city: bid.seller.city, province: bid.seller.province }
        : undefined
    };
  });
}

export async function getDeliveryConfirmation(rfqId: string) {
  await connectToDatabase();
  const DeliveryConfirmation = (await import("@/models/DeliveryConfirmation")).default;
  const record = await DeliveryConfirmation.findOne({ rfq: rfqId }).lean();
  if (!record) return null;
  return {
    buyerConfirmed: record.buyerConfirmed,
    sellerConfirmed: record.sellerConfirmed,
    completed: Boolean(record.completedAt)
  };
}

export async function getRatingForRfq(rfqId: string) {
  await connectToDatabase();
  const Rating = (await import("@/models/Rating")).default;
  const rating = await Rating.findOne({ rfq: rfqId }).lean();
  if (!rating) return null;
  return { stars: rating.stars, comment: rating.comment ?? "" };
}

export async function getPendingViolations() {
  await connectToDatabase();
  const SellerViolation = (await import("@/models/SellerViolation")).default;
  const violations = await SellerViolation.find({ status: "pending_review" })
    .populate("seller", "name email strikeCount status")
    .populate("rfq", "title slug")
    .sort({ createdAt: -1 })
    .lean();

  return violations.map((v: any) => ({
    id: String(v._id),
    type: v.type,
    reason: v.reason,
    resultingStrikeNumber: v.resultingStrikeNumber,
    createdAt: v.createdAt?.toISOString?.() ?? v.createdAt,
    seller: v.seller
      ? {
          id: String(v.seller._id),
          name: v.seller.name,
          email: v.seller.email,
          strikeCount: v.seller.strikeCount ?? 0,
          status: v.seller.status
        }
      : null,
    rfq: v.rfq ? { title: v.rfq.title, slug: v.rfq.slug } : null
  }));
}

export async function getSellerViolationHistory(sellerId: string) {
  await connectToDatabase();
  const SellerViolation = (await import("@/models/SellerViolation")).default;
  const violations = await SellerViolation.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .lean();
  return violations.map((v: any) => ({
    id: String(v._id),
    type: v.type,
    reason: v.reason,
    status: v.status,
    resultingStrikeNumber: v.resultingStrikeNumber,
    createdAt: v.createdAt?.toISOString?.() ?? v.createdAt
  }));
}

export async function getSuggestions() {
  await connectToDatabase();
  const Suggestion = (await import("@/models/Suggestion")).default;
  const suggestions = await Suggestion.find().sort({ createdAt: -1 }).lean();
  return suggestions.map((s) => ({
    id: String(s._id),
    name: s.name,
    email: s.email ?? null,
    role: s.role ?? "guest",
    message: s.message,
    status: s.status,
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt
  }));
}

export async function getUnreadSuggestionsCount() {
  await connectToDatabase();
  const Suggestion = (await import("@/models/Suggestion")).default;
  return Suggestion.countDocuments({ status: "new" });
}

export { serialize };
