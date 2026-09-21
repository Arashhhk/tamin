import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین استفاده از پلتفرم پله برای خریداران و فروشندگان.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <StaticPage title="قوانین و مقررات">
      <p>با استفاده از پله، شما با موارد زیر موافقت می‌کنید:</p>
      <ol className="list-decimal space-y-2 pr-5">
        <li>اطلاعات ثبت‌شده در درخواست‌های خرید و پیشنهادها باید صحیح و واقعی باشد.</li>
        <li>هویت فروشندگان تا زمان انتخاب توسط خریدار محرمانه می‌ماند و افشای غیرمجاز آن ممنوع است.</li>
        <li>پس از انتخاب یک پیشنهاد، طرفین موظف به هماهنگی صادقانه برای تحویل کالا هستند.</li>
        <li>تایید تحویل باید صرفاً پس از دریافت واقعی کالا یا خدمات ثبت شود.</li>
        <li>پله در قبال معاملات انجام‌شده خارج از پلتفرم مسئولیتی ندارد.</li>
      </ol>
      <p className="text-xs text-ink-400">
        این متن نمونه اولیه است و باید پیش از انتشار رسمی توسط تیم حقوقی
        بازبینی شود.
      </p>
    </StaticPage>
  );
}
