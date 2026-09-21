import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "پله چطور کار می‌کند",
  description: "مراحل خرید و فروش در پلتفرم مزایده معکوس پله.",
  alternates: { canonical: "/how-it-works" }
};

const steps = [
  { title: "۱. ثبت درخواست خرید", body: "آنچه نیاز دارید را با جزئیات (دسته‌بندی، مقدار، مکان تحویل) ثبت می‌کنید." },
  { title: "۲. دریافت پیشنهاد از فروشندگان", body: "فروشندگان مختلف روی درخواست شما قیمت پیشنهاد می‌دهند؛ هویت آن‌ها تا انتخاب نهایی برای شما نمایش داده نمی‌شود." },
  { title: "۳. انتخاب بهترین پیشنهاد", body: "پیشنهادها را مقایسه و بهترین گزینه را انتخاب می‌کنید. آگهی از فهرست عمومی حذف می‌شود و اطلاعات فروشنده در اختیار شما قرار می‌گیرد." },
  { title: "۴. هماهنگی و تحویل", body: "مستقیماً با فروشنده هماهنگ می‌کنید. با تایید تحویل از سوی هر دو طرف، معامله تکمیل می‌شود." }
];

export default function HowItWorksPage() {
  return (
    <StaticPage title="پله چطور کار می‌کند؟">
      <ol className="space-y-6">
        {steps.map((s) => (
          <li key={s.title}>
            <h2 className="mb-1 font-extrabold text-ink-900">{s.title}</h2>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </StaticPage>
  );
}
