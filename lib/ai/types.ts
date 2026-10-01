import type { SeoField } from "../category-seo";

export interface SeoDraft {
  seoTitle: string;
  seoDescription: string;
  description: string;
  seoContent: string;
  faq: { q: string; a: string }[];
}

export type GenerateSeoResult =
  | {
      ok: true;
      status: "generated";
      draft: SeoDraft; // generated fields filled in; non-generated fields = existing values
      existing: SeoDraft;
      generatedFields: SeoField[];
      warnings: string[];
      model: string;
    }
  | { ok: true; status: "skipped"; reason: string }
  | { ok: false; error: string; retryable: boolean };

export type ApplySeoResult =
  | { ok: true; applied: SeoField[]; skipped: SeoField[] }
  | { ok: false; error: string };
