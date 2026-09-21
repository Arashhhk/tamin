import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SuggestionForm from "./SuggestionForm";
import { getCurrentUser } from "@/lib/current-user";
import { MessageSquarePlus } from "lucide-react";

export const metadata: Metadata = {
  title: "پیشنهادات و انتقادات",
  description: "نظر، پیشنهاد یا انتقاد خود درباره‌ی پله را با ما در میان بگذارید.",
  alternates: { canonical: "/suggestions" }
};

export default async function SuggestionsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-camel-50 text-camel-600">
            <MessageSquarePlus className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-extrabold text-ink-900">پیشنهادات و انتقادات</h1>
          <p className="mt-1 text-sm text-ink-500">
            نظرتان مستقیم به تیم پله می‌رسد و برای بهتر شدن پلتفرم بررسی می‌شود.
          </p>
        </div>

        <div className="rounded-xl2 border border-line bg-white p-6 shadow-card">
          <SuggestionForm loggedInName={user?.name ?? null} />
        </div>
      </main>
      <Footer />
    </>
  );
}
