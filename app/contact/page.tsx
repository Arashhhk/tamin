import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با تیم پشتیبانی تامین.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">تماس با ما</h1>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-ink-600">
              <Mail className="h-4 w-4 text-camel-500" />
              support@tamin-market.ir
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-600">
              <Phone className="h-4 w-4 text-camel-500" />
              ۰۲۱-۰۰۰۰۰۰۰
            </p>
            <p className="flex items-center gap-2 text-sm text-ink-600">
              <MapPin className="h-4 w-4 text-camel-500" />
              تهران، ایران
            </p>
          </div>
          <form className="space-y-3 rounded-xl2 border border-line bg-white p-5 shadow-card">
            <input
              placeholder="نام شما"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
            <input
              placeholder="ایمیل"
              type="email"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
            <textarea
              placeholder="پیام شما"
              rows={4}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm focus:border-camel-400"
            />
            <button className="w-full rounded-lg bg-camel-500 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600">
              ارسال پیام
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
