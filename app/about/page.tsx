import type { Metadata } from "next";
import StaticPage from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "درباره پله",
  description: "پله، پلتفرم مزایده معکوس برای خرید و تأمین کالا و خدمات صنعتی و تجاری.",
  alternates: { canonical: "/about" }
};

// Fully static content — no per-user data anywhere in this page or in
// Header/Footer (both fixed to not read cookies; see app/layout.tsx
// and components/Header.tsx). This is genuinely safe to statically
// generate and revalidate periodically, unlike the marketplace pages
// (app/page.tsx and friends), which stay `force-dynamic` for live
// data reasons explained there.
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <StaticPage title="درباره پله">
      <p>
        پله یک پلتفرم مزایده معکوس است: به‌جای این‌که فروشنده قیمت
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
