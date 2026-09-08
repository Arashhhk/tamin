import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getSellerBidHistory } from "@/lib/queries";
import { connectToDatabase } from "@/lib/mongodb";
import Rfq from "@/models/Rfq";
import Bid from "@/models/Bid";
import { formatToman } from "@/lib/format";

export const metadata: Metadata = {
  title: "پیشنهادهای من",
  robots: { index: false, follow: false }
};

export default async function ProfileBidsPage() {
  const user = (await getCurrentUser())!;

  let rows: { id: string; rfqTitle: string; rfqSlug?: string; price: number; note?: string; createdAt: string }[] = [];

  if (user.role === "seller") {
    rows = await getSellerBidHistory(String(user._id));
  } else {
    // Buyer view: bids received across their own RFQs (still respects the
    // hidden-seller rule — seller identity intentionally omitted here).
    await connectToDatabase();
    const myRfqIds = await Rfq.find({ buyer: user._id }).distinct("_id");
    const bids = await Bid.find({ rfq: { $in: myRfqIds } })
      .populate("rfq", "title slug")
      .sort({ createdAt: -1 })
      .lean();
    rows = bids.map((b: any) => ({
      id: String(b._id),
      rfqTitle: b.rfq?.title ?? "",
      rfqSlug: b.rfq?.slug,
      price: b.price,
      note: b.note,
      createdAt: b.createdAt?.toISOString?.() ?? b.createdAt
    }));
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-line bg-white shadow-card">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-400">
            <th className="px-4 py-3 font-bold">مربوط به درخواست</th>
            <th className="px-4 py-3 font-bold">قیمت</th>
            <th className="px-4 py-3 font-bold">توضیح</th>
            <th className="px-4 py-3 font-bold">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-line last:border-0 hover:bg-camel-50/40">
              <td className="px-4 py-3 font-bold text-ink-900">
                {b.rfqSlug ? (
                  <Link href={`/rfq/${b.rfqSlug}`} className="hover:text-camel-600">
                    {b.rfqTitle}
                  </Link>
                ) : (
                  b.rfqTitle
                )}
              </td>
              <td className="num px-4 py-3 font-bold text-camel-600">{formatToman(b.price)}</td>
              <td className="px-4 py-3 text-ink-500">{b.note || "—"}</td>
              <td className="num px-4 py-3 text-ink-600">
                {new Date(b.createdAt).toLocaleDateString("fa-IR")}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-400">
                هنوز پیشنهادی ثبت نشده است.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
