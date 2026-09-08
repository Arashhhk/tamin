import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Rfq from "@/models/Rfq";
import DeliveryConfirmation from "@/models/DeliveryConfirmation";

/**
 * POST /api/rfq/:id/delivery
 *
 * Either the buyer or the selected seller marks delivery as confirmed on
 * their side. When BOTH sides have confirmed, rfq.status -> 'completed'.
 * (No payment/settlement is triggered here in the current phase — this
 * endpoint is purely the two-sided acknowledgement the brief asked for.)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "غیرمجاز" }, { status: 401 });

  const rfq = await Rfq.findById(params.id);
  if (!rfq || !rfq.selectedBid) {
    return NextResponse.json({ error: "این درخواست هنوز فروشنده انتخاب‌شده ندارد" }, { status: 409 });
  }
  const record =
    (await DeliveryConfirmation.findOne({ rfq: params.id })) ||
    new DeliveryConfirmation({ rfq: params.id, bid: rfq.selectedBid });

  const isBuyer = session.role === "buyer" && String(rfq.buyer) === session.userId;
  if (isBuyer) {
    record.buyerConfirmed = true;
    record.buyerConfirmedAt = new Date();
  } else if (session.role === "seller") {
    record.sellerConfirmed = true;
    record.sellerConfirmedAt = new Date();
  } else {
    return NextResponse.json({ error: "غیرمجاز" }, { status: 403 });
  }

  if (record.buyerConfirmed && record.sellerConfirmed && !record.completedAt) {
    record.completedAt = new Date();
    rfq.status = "completed";
    await rfq.save();
  }

  await record.save();

  return NextResponse.json({
    buyerConfirmed: record.buyerConfirmed,
    sellerConfirmed: record.sellerConfirmed,
    completed: Boolean(record.completedAt)
  });
}
