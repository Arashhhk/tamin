import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: "نحوه جمع‌آوری، استفاده و محافظت از اطلاعات کاربران در تامین.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <StaticPage title="حریم خصوصی">
      <p>
        ما به حریم خصوصی کاربران خود احترام می‌گذاریم. اطلاعات شخصی
        کاربران (نام، اطلاعات تماس، سوابق درخواست و پیشنهاد) صرفاً برای
        ارائه خدمات پلتفرم استفاده می‌شود.
      </p>
      <p>
        اطلاعات هویتی فروشندگان تا پیش از انتخاب توسط خریدار، در هیچ
        بخشی از پلتفرم به‌صورت عمومی یا در اختیار خریدار قرار نمی‌گیرد.
      </p>
      <p>
        اطلاعات کاربران بدون رضایت آن‌ها در اختیار اشخاص ثالث قرار
        نمی‌گیرد، مگر در مواردی که قانون ملزم کند.
      </p>
    </StaticPage>
  );
}
