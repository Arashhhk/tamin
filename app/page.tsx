import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SectionHeader from "@/components/SectionHeader";
import CategoryGrid from "@/components/CategoryGrid";
import RfqCard from "@/components/RfqCard";
import HowItWorksSection from "@/components/HowItWorksSection";
import TopSellers from "@/components/TopSellers";
import Announcements from "@/components/Announcements";
import Footer from "@/components/Footer";
import { getParentCategories, getActiveRfqs, getTopSellers, getTopBuyers } from "@/lib/queries";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} | مزایده آنلاین خرید و تأمین کالا`,
  description: site.description,
  alternates: { canonical: "/" }
};

export default async function HomePage() {
  const [categories, activeRfqs, topSellers, topBuyers] = await Promise.all([
    getParentCategories(),
    getActiveRfqs({ limit: 8 }),
    getTopSellers(3),
    getTopBuyers(3)
  ]);

  return (
    <>
      <Header />
      <main>
        {/* 1. Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <Hero />
        </section>

        {/* 2. How it works */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionHeader
            title="پله چطور کار می‌کند؟"
            subtitle="چهار قدم ساده تا تامین کالای مورد نیاز شما."
          />
          <HowItWorksSection />
        </section>

        {/* 3. Popular categories */}
        <section className="border-t border-line bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              title="دسته‌بندی‌های محبوب"
              subtitle="آنچه نیاز دارید را در دسته‌بندی مناسب پیدا کنید."
              href="/categories"
            />
            <CategoryGrid categories={categories} />
          </div>
        </section>

        {/* 4. Active auctions */}
        <section className="border-t border-line py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              title="مزایده‌های فعال"
              subtitle="روی این درخواست‌ها همین حالا می‌توانید پیشنهاد قیمت بدهید."
              href="/rfq"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {activeRfqs.map((rfq) => (
                <RfqCard key={rfq.id} rfq={rfq} />
              ))}
              {activeRfqs.length === 0 && (
                <p className="col-span-full rounded-xl2 border border-dashed border-line bg-sand p-8 text-center text-sm text-ink-400">
                  در حال حاضر مزایده فعالی وجود ندارد.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 5. Top sellers */}
        <section className="border-t border-line py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              title="برترین فروشندگان"
              subtitle="فروشندگانی با بالاترین امتیاز و بیشترین معاملات موفق."
              href="/sellers"
            />
            <TopSellers sellers={topSellers} />
          </div>
        </section>

        {/* 5b. Top buyers */}
        <section className="border-t border-line bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              title="خریداران برتر"
              subtitle="خریدارانی با بیشترین تعداد خرید موفق."
              href="/buyers"
            />
            <TopSellers sellers={topBuyers} dealsLabel="خرید موفق" href="/buyers" scoreDisplay="trust" />
          </div>
        </section>

        {/* 6. Announcements */}
        <section className="border-t border-line bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader title="اطلاعیه‌ها" />
            <Announcements />
          </div>
        </section>
      </main>
      {/* 7. Footer */}
      <Footer />
    </>
  );
}
