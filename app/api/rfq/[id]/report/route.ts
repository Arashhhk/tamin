import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";
import SellerViolation from "@/models/SellerViolation";

/**
 * POST /api/rfq/:id/report
 *
 * Lets the RFQ's buyer report that the winning seller never delivered.
 * Unlike the automated checks in lib/violations.ts (suspicious price,
 * overdue delivery), a buyer report is subjective — it does NOT apply a
 * strike automatically. It goes straight into the admin violations queue
 * (`status: 'pending_review'`) for a human to confirm or dismiss.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || session.role !== "buyer") {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  const rfq = await Rfq.findById(params.id);
  if (!rfq || String(rfq.buyer) !== session.userId) {
    return NextResponse.json({ error: "شما مالک این درخواست نیستید" }, { status: 403 });
  }
  if (!rfq.selectedBid) {
    return NextResponse.json({ error: "این درخواست هنوز فروشنده انتخاب‌شده ندارد" }, { status: 409 });
  }

  const existing = await SellerViolation.findOne({
    rfq: params.id,
    type: "buyer_report",
    status: "pending_review"
  });
  if (existing) {
    return NextResponse.json({ error: "قبلاً برای این درخواست گزارش ثبت کرده‌اید." }, { status: 409 });
  }

  const bid = await Bid.findById(rfq.selectedBid);
  if (!bid) return NextResponse.json({ error: "پیشنهاد یافت نشد" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const note = String(body?.note || "").slice(0, 500);

  await SellerViolation.create({
    seller: bid.seller,
    rfq: rfq._id,
    bid: bid._id,
    type: "buyer_report",
    reason: note || "خریدار گزارش داد که فروشنده کالا را تحویل نداده است.",
    status: "pending_review",
    reportedBy: session.userId
  });

  return NextResponse.json({ message: "گزارش شما ثبت شد و توسط مدیریت بررسی می‌شود." });
}
