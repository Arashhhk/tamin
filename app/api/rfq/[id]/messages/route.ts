import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { isChatClosed } from "@/lib/chat";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";
import Message from "@/models/Message";

/**
 * Chat is scoped to exactly one RFQ and exactly two participants: its
 * buyer and whichever seller ended up selected — mirrors
 * app/api/rfq/[id]/delivery/route.ts's access rule (same
 * showDeliveryPanel condition on the page), since this exists for the
 * same reason: once a bid is selected, the two sides need to actually
 * coordinate delivery. Available from selection onward (not just
 * while in_progress) so it's still usable after completion for any
 * follow-up.
 */
async function authorize(rfqId: string) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "غیرمجاز" }, { status: 401 }) };

  const rfq = await Rfq.findById(rfqId).select("buyer selectedBid status selectedAt");
  if (!rfq || !rfq.selectedBid) {
    return { error: NextResponse.json({ error: "هنوز فروشنده‌ای برای این درخواست انتخاب نشده" }, { status: 409 }) };
  }

  const isBuyer = session.role === "buyer" && String(rfq.buyer) === session.userId;
  let isSeller = false;
  if (session.role === "seller") {
    const bid = await Bid.findById(rfq.selectedBid).select("seller");
    isSeller = Boolean(bid && String(bid.seller) === session.userId);
  }
  if (!isBuyer && !isSeller) {
    return { error: NextResponse.json({ error: "شما در این معامله طرف نیستید" }, { status: 403 }) };
  }
  return { session, rfq };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const auth = await authorize(params.id);
  if (auth.error) return auth.error;

  const messages = await Message.find({ rfq: params.id }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: String(m._id),
      senderRole: m.senderRole,
      isMine: String(m.sender) === auth.session!.userId,
      body: m.body,
      createdAt: m.createdAt?.toISOString?.() ?? m.createdAt
    }))
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const auth = await authorize(params.id);
  if (auth.error) return auth.error;

  if (isChatClosed(auth.rfq!)) {
    return NextResponse.json({ error: "این گفتگو بسته شده است" }, { status: 409 });
  }

  const { body } = await req.json().catch(() => ({ body: "" }));
  const text = typeof body === "string" ? body.trim().slice(0, 2000) : "";
  if (!text) return NextResponse.json({ error: "متن پیام خالی است" }, { status: 400 });

  await Message.create({
    rfq: params.id,
    sender: auth.session!.userId,
    senderRole: auth.session!.role,
    body: text
  });

  return NextResponse.json({ ok: true });
}
