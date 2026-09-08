import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StaticPage({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">{title}</h1>
        <div className="space-y-4 text-sm leading-7 text-ink-600">{children}</div>
      </main>
      <Footer />
    </>
  );
}
