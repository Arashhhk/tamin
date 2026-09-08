import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RfqCard from "@/components/RfqCard";
import { getActiveRfqs } from "@/lib/queries";

export const metadata: Metadata = {
  title: "همه درخواست‌های خرید فعال",
  description:
    "لیست کامل درخواست‌های خرید فعال روی تامین؛ روی هر درخواست، فروشندگان قیمت پیشنهاد می‌دهند.",
  alternates: { canonical: "/rfq" }
};

export const revalidate = 30;

export default async function RfqListPage() {
  // getActiveRfqs already filters status:'active' at the query level —
  // once a buyer selects a bid the RFQ disappears from here automatically.
  const publicRfqs = await getActiveRfqs({ limit: 200 });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl font-extrabold text-ink-900">
          درخواست‌های خرید فعال ({publicRfqs.length})
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {publicRfqs.map((rfq) => (
            <RfqCard key={rfq.id} rfq={rfq} />
          ))}
          {publicRfqs.length === 0 && (
            <p className="col-span-full rounded-xl2 border border-dashed border-line bg-white p-8 text-center text-sm text-ink-400">
              در حال حاضر درخواست فعالی وجود ندارد.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
