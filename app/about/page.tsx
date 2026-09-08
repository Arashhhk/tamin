import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "درباره تامین",
  description: "تامین، پلتفرم مزایده معکوس برای خرید و تأمین کالا و خدمات صنعتی و تجاری.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  return (
    <StaticPage title="درباره تامین">
      <p>
        تامین یک پلتفرم مزایده معکوس است: به‌جای این‌که فروشنده قیمت
        بگذارد و خریدار انتخاب کند، خریدار نیاز خود را اعلام می‌کند و
        فروشندگان مختلف برای جلب رضایت او بهترین قیمت را پیشنهاد می‌دهند.
      </p>
      <p>
        هدف ما ساده‌سازی فرآیند تأمین کالا و خدمات برای کسب‌وکارها و
        افراد، و ایجاد یک بازار شفاف و رقابتی برای فروشندگان است.
      </p>
    </StaticPage>
  );
}
