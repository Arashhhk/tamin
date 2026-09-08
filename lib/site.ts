export const site = {
  name: "تامین",
  nameEn: "Tamin",
  tagline: "پلتفرم مزایده‌ی تأمین کالا و خدمات",
  description:
    "تامین، پلتفرم مزایده‌ی معکوس برای خرید و تأمین کالا: درخواست خرید خود را ثبت کنید تا بهترین فروشندگان برایتان قیمت پیشنهاد دهند.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://tamin-market.ir",
  locale: "fa_IR",
  themeColor: "#E8792A",
  twitter: "@tamin_market",
  keywords: [
    "مزایده آنلاین",
    "درخواست خرید",
    "تامین کالا",
    "خرید عمده",
    "استعلام قیمت",
    "مناقصه و مزایده",
    "پلتفرم B2B",
    "فروش صنعتی"
  ]
};

export function absoluteUrl(path: string) {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
