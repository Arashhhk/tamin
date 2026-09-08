import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";

/**
 * POST /api/rfq/:id/select  { bidId }
 *
 * The pivotal business-logic step:
 *   1. Only the RFQ's own buyer may call this, and only while status === 'active'.
 *   2. The chosen bid -> status 'selected'; every other bid on this RFQ -> 'rejected'.
 *   3. rfq.selectedBid is set and rfq.status moves to 'in_progress'.
 *   4. From this point the RFQ is excluded from all public listing queries
 *      (they all filter status:'active'), i.e. it "goes off the market".
 *   5. The buyer can now fetch the seller's contact info via GET /bids
 *      (see the isSelected + isBuyerOwner check in that route) to coordinate
 *      delivery directly with them.
 *
 * No payment/escrow step exists yet — that's intentionally out of scope
 * for the current phase and can be inserted between steps 3 and 4 later.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || session.role !== "buyer") {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  const { bidId } = await req.json();

  const rfq = await Rfq.findById(params.id);
  if (!rfq) return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
  if (String(rfq.buyer) !== session.userId) {
    return NextResponse.json({ error: "شما مالک این درخواست نیستید" }, { status: 403 });
  }
  if (rfq.status !== "active") {
    return NextResponse.json({ error: "این درخواست قبلاً بسته شده است" }, { status: 409 });
  }

  const winningBid = await Bid.findOne({ _id: bidId, rfq: params.id });
  if (!winningBid) return NextResponse.json({ error: "پیشنهاد یافت نشد" }, { status: 404 });

  await Bid.updateMany({ rfq: params.id, _id: { $ne: bidId } }, { $set: { status: "rejected" } });
  winningBid.status = "selected";
  await winningBid.save();

  rfq.selectedBid = winningBid._id;
  rfq.selectedAt = new Date();
  rfq.status = "in_progress";
  await rfq.save();

  const seller = await winningBid.populate("seller", "name phone companyName city province");

  return NextResponse.json({
    message: "فروشنده انتخاب شد. اطلاعات تماس در دسترس شماست.",
    seller: (seller as any).seller
  });
}
