import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { isEffectivelySuspended, checkSuspiciousBid } from "@/lib/violations";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";
import User from "@/models/User";

/**
 * GET /api/rfq/:id/bids
 *
 * Buyer-facing bid list. Core business rule enforced here:
 *   - While the RFQ is still open (status === 'active'), seller identity
 *     is NEVER sent to the client — only price, note, and timestamp.
 *   - Once a bid has been selected (rfq.status !== 'active'), the selected
 *     bid includes the seller's public profile so the buyer can coordinate.
 *   - A seller requesting this endpoint only ever sees their OWN bid with
 *     their own identity attached; other sellers' bids stay priceless/anonymous
 *     to them too (sellers only ever compete on price, not each other's info).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();

  const rfq = await Rfq.findById(params.id).lean();
  if (!rfq) return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });

  const bids = await Bid.find({ rfq: params.id }).sort({ price: 1 }).lean();

  const isBuyerOwner = session?.role === "buyer" && String((rfq as any).buyer) === session.userId;

  const shaped = bids.map((bid: any) => {
    const isSelected = String(bid._id) === String((rfq as any).selectedBid);
    const isOwnBid = session?.role === "seller" && String(bid.seller) === session.userId;

    const canSeeSellerIdentity = isSelected && isBuyerOwner ? true : isOwnBid;

    return {
      id: bid._id,
      price: bid.price,
      note: bid.note,
      status: bid.status,
      createdAt: bid.createdAt,
      // seller identity withheld unless the viewer is entitled to it
      seller: canSeeSellerIdentity ? bid.seller : undefined
    };
  });

  return NextResponse.json({ bids: shaped });
}

/**
 * POST /api/rfq/:id/bids  { price, note }
 * Sellers submit a bid. One bid per seller per RFQ (unique index on Bid).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const session = await getSession();
  if (!session || session.role !== "seller") {
    return NextResponse.json({ error: "فقط فروشندگان می‌توانند پیشنهاد ثبت کنند" }, { status: 403 });
  }

  const seller = await User.findById(session.userId);
  if (!seller || isEffectivelySuspended(seller)) {
    return NextResponse.json({ error: "حساب شما مسدود است" }, { status: 403 });
  }
  if (!seller.sellerTermsAcceptedAt) {
    return NextResponse.json(
      { error: "ابتدا باید شرایط و قوانین فروشندگان را بپذیرید." },
      { status: 403 }
    );
  }

  const rfq = await Rfq.findById(params.id);
  if (!rfq || rfq.status !== "active") {
    return NextResponse.json({ error: "این درخواست دیگر باز نیست" }, { status: 409 });
  }

  const body = await req.json();
  const price = Number(body.price);
  if (!price || price <= 0) {
    return NextResponse.json({ error: "قیمت نامعتبر است" }, { status: 400 });
  }

  const bid = await Bid.findOneAndUpdate(
    { rfq: params.id, seller: session.userId },
    { $set: { price, note: body.note, status: "pending" } },
    { upsert: true, new: true }
  );

  // Fire-and-forget-ish but awaited: flags + strikes a bid priced under
  // 70% of the average of the other pending bids on this RFQ. Runs after
  // the bid is saved so the seller still gets their normal success
  // response even if this check itself has an issue.
  try {
    await checkSuspiciousBid(params.id, session.userId, price);
  } catch (err) {
    console.error("checkSuspiciousBid failed:", err);
  }

  return NextResponse.json({ bid: { id: bid._id, price: bid.price, status: bid.status } });
}
