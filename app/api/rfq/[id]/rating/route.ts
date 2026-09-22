import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { applyRatingToSeller } from "@/lib/ratings";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";
import Rating from "@/models/Rating";

/**
 * POST /api/rfq/:id/rating
 *
 * Only the buyer who owns the RFQ, only once the deal is fully
 * "completed" (both sides confirmed delivery — see
 * app/api/rfq/[id]/delivery/route.ts), and only once per RFQ (the
 * unique index on Rating.rfq is the real guard; the findOne check
 * below just gives a clean error message instead of a raw duplicate-
 * key crash).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || session.role !== "buyer") {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  const rfq = await Rfq.findById(params.id);
  if (!rfq || String(rfq.buyer) !== session.userId) {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }
  if (rfq.status !== "completed" || !rfq.selectedBid) {
    return NextResponse.json({ error: "این معامله هنوز تکمیل نشده است" }, { status: 409 });
  }

  const existing = await Rating.findOne({ rfq: rfq._id });
  if (existing) {
    return NextResponse.json({ error: "شما قبلاً برای این معامله امتیاز ثبت کرده‌اید" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const stars = Number(body.stars);
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : undefined;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "امتیاز باید بین ۱ تا ۵ باشد" }, { status: 400 });
  }

  const bid = await Bid.findById(rfq.selectedBid).select("seller");
  if (!bid) return NextResponse.json({ error: "فروشنده این درخواست یافت نشد" }, { status: 404 });

  await Rating.create({
    rfq: rfq._id,
    buyer: session.userId,
    seller: bid.seller,
    stars,
    comment
  });

  await applyRatingToSeller(String(bid.seller), stars);

  return NextResponse.json({ ok: true, stars, comment: comment || "" });
}
