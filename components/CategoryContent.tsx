/**
 * Admin-authored editorial content for a category page. Renders NOTHING
 * when the admin hasn't written any — no placeholder or generated text.
 *
 * FAQPage JSON-LD is emitted only for FAQ items that are actually
 * rendered on the page below, so markup always matches visible content.
 */
export default function CategoryContent({
  content,
  faq
}: {
  content: string;
  faq: { q: string; a: string }[];
}) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0 && faq.length === 0) return null;

  const jsonLd =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a }
          }))
        }
      : null;

  return (
    <section className="mt-10 border-t border-line pt-8">
      {blocks.length > 0 && (
        <div className="space-y-3 text-sm leading-7 text-ink-600">
          {blocks.map((b, i) =>
            b.startsWith("## ") ? (
              <h2 key={i} className="pt-2 text-base font-extrabold text-ink-900">
                {b.slice(3)}
              </h2>
            ) : (
              <p key={i}>{b}</p>
            )
          )}
        </div>
      )}
      {faq.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-extrabold text-ink-900">سوالات متداول</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="text-sm font-bold text-ink-900">{f.q}</h3>
                <p className="mt-1 text-sm leading-7 text-ink-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </section>
  );
}
