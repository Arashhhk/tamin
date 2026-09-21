"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import SellerViolation from "@/models/SellerViolation";
import User from "@/models/User";

// NOTE: `reviewedBy` (a Mongo ObjectId ref to a User) is intentionally
// left unset below. Since admin auth is now a single shared
// ADMIN_USERNAME/ADMIN_PASSWORD from .env.local rather than a User
// document (see lib/admin-auth.ts), there is no admin user id to
// record here. `reviewedAt` still captures *when* a decision was made,
// which covers the audit-trail need in practice.

export async function banSellerAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const violationId = String(formData.get("violationId") || "");
  const violation = await SellerViolation.findById(violationId);
  if (!violation) throw new Error("پرونده یافت نشد");

  await User.findByIdAndUpdate(violation.seller, {
    status: "suspended",
    banReviewPending: false
  });

  violation.status = "reviewed_banned";
  violation.reviewedAt = new Date();
  await violation.save();

  // Clear the pending flag on any other open violations for this seller
  // too, since the account is now fully banned.
  await SellerViolation.updateMany(
    { seller: violation.seller, status: "pending_review" },
    { $set: { status: "reviewed_banned", reviewedAt: new Date() } }
  );

  revalidatePath("/admin/violations");
  revalidatePath("/admin/users");
}

export async function dismissViolationAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const violationId = String(formData.get("violationId") || "");
  const violation = await SellerViolation.findById(violationId);
  if (!violation) throw new Error("پرونده یافت نشد");

  violation.status = "reviewed_dismissed";
  violation.reviewedAt = new Date();
  await violation.save();

  // If this was the violation that triggered the review flag, clear it
  // so the seller isn't stuck — only if they have no other pending cases.
  const stillPending = await SellerViolation.countDocuments({
    seller: violation.seller,
    status: "pending_review"
  });
  if (stillPending === 0) {
    await User.findByIdAndUpdate(violation.seller, { banReviewPending: false });
  }

  revalidatePath("/admin/violations");
  revalidatePath("/admin/users");
}
