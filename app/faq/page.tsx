import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description: "پاسخ به پرسش‌های رایج درباره ثبت درخواست خرید، ارسال پیشنهاد و تحویل کالا در پله.",
  alternates: { canonical: "/faq" }
};

const faqs = [
  {
    q: "ثبت درخواست خرید چقدر هزینه دارد؟",
    a: "ثبت درخواست خرید رایگان است. جزئیات کارمزد احتمالی معاملات در آینده اعلام می‌شود."
  },
  {
    q: "چرا اطلاعات فروشنده را نمی‌بینم؟",
    a: "تا زمانی که مزایده باز است و شما پیشنهادی را انتخاب نکرده‌اید، هویت فروشندگان مخفی می‌ماند تا رقابت روی قیمت و کیفیت پیشنهاد باشد، نه شناخته‌شدگی برند."
  },
  {
    q: "بعد از انتخاب فروشنده چه اتفاقی می‌افتد؟",
    a: "آگهی شما از فهرست عمومی حذف می‌شود، اطلاعات تماس فروشنده منتخب در اختیار شما قرار می‌گیرد و می‌توانید مستقیماً هماهنگی تحویل را انجام دهید."
  },
  {
    q: "تحویل کالا چطور تایید می‌شود؟",
    a: "پس از دریافت کالا، هم شما و هم فروشنده باید تحویل را در پروفایل خود تایید کنید تا معامله تکمیل‌شده ثبت شود."
  },
  {
    q: "آیا امکان پرداخت آنلاین در پلتفرم وجود دارد؟",
    a: "در حال حاضر خیر؛ هماهنگی پرداخت مستقیماً بین خریدار و فروشنده انجام می‌شود. این قابلیت ممکن است در آینده به پلتفرم اضافه شود."
  }
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  return (
    <StaticPage title="سوالات متداول">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-6">
        {faqs.map((f) => (
          <div key={f.q}>
            <h2 className="mb-1 font-extrabold text-ink-900">{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
