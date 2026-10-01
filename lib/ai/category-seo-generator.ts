import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import { site } from "@/lib/site";
import { generateText, AiError } from "./provider";
import {
  SEO_FIELDS,
  getMissingSeoFields,
  type SeoField
} from "@/lib/category-seo";
import type { SeoDraft, GenerateSeoResult } from "./types";

// Limits mirror models/Category.ts (hard caps) and lib/category-seo.ts
// (what counts as real content for indexing).
const LIMITS = {
  seoTitle: { min: 15, max: 70 },
  seoDescription: { min: 70, max: 170 },
  description: { min: 150, max: 1500 },
  seoContent: { min: 300, max: 8000 },
  faq: { minItems: 3, maxItems: 6, qMax: 200, aMin: 20, aMax: 600 }
};

/** Cleans model output into the plain format the category page renders. */
function sanitizeText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "") // no HTML
    .replace(/\*\*/g, "") // no bold markers
    .replace(/^#{3,}\s+/gm, "## ") // only one heading level is supported
    .replace(/^#\s+/gm, "## ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function oneLine(s: unknown): string {
  return sanitizeText(String(s ?? "")).replace(/\s*\n+\s*/g, " ").trim();
}

/**
 * Validates + normalizes model (or client-submitted) output for the given
 * fields. Used BOTH after generation and again server-side before saving,
 * so nothing unvalidated can reach the database.
 */
export function validateSeoFields(
  raw: any,
  fields: SeoField[]
): { ok: true; data: Partial<SeoDraft> } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const data: Partial<SeoDraft> = {};
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["خروجی یک شیء JSON نیست"] };

  for (const f of fields) {
    if (f === "faq") {
      const arr = Array.isArray(raw.faq) ? raw.faq : [];
      const seen = new Set<string>();
      const items: { q: string; a: string }[] = [];
      for (const it of arr) {
        const q = oneLine(it?.q);
        const a = sanitizeText(String(it?.a ?? "")).replace(/\n+/g, " ").trim();
        if (!q || !a || seen.has(q)) continue;
        seen.add(q);
        items.push({ q, a });
      }
      const L = LIMITS.faq;
      if (items.length < L.minItems || items.length > L.maxItems) {
        errors.push(`تعداد سوالات متداول باید ${L.minItems} تا ${L.maxItems} باشد (الان ${items.length})`);
      } else if (items.some((i) => i.q.length > L.qMax || i.a.length < L.aMin || i.a.length > L.aMax)) {
        errors.push(`طول سوال‌ها/پاسخ‌ها مجاز نیست (سوال حداکثر ${L.qMax}، پاسخ ${L.aMin} تا ${L.aMax} کاراکتر)`);
      } else {
        data.faq = items;
      }
      continue;
    }
    const isLine = f === "seoTitle" || f === "seoDescription";
    const value = isLine ? oneLine(raw[f]) : sanitizeText(String(raw[f] ?? ""));
    const { min, max } = LIMITS[f];
    if (value.length < min || value.length > max) {
      errors.push(`«${f}» باید بین ${min} تا ${max} کاراکتر باشد (الان ${value.length})`);
    } else {
      (data as any)[f] = value;
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// ---- risky-claim + similarity warnings (advisory, shown in the preview) ----

const RISKY = [
  { re: /\d+\s*(%|٪|درصد)/, msg: "شامل عدد/درصد است؛ مطمئن شوید واقعی است" },
  { re: /ارزان[‌ ]?ترین|بهترین قیمت|تضمین|۱۰۰\s*٪|صددرصد/, msg: "ادعای قیمت/تضمین قابل اثبات نیست؛ حذف یا ملایم شود" },
  { re: /(بیش از|بالغ بر)\s*[\d۰-۹]+/, msg: "آمار عددی دارد؛ بررسی شود" }
];

function trigrams(text: string): Set<string> {
  const words = text.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) out.add(words.slice(i, i + 3).join(" "));
  return out;
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return inter / (a.size + b.size - inter);
}

// ---- context -------------------------------------------------------------

interface CatDoc {
  _id: any;
  name: string;
  slug: string;
  parent?: any;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  seoContent?: string;
  faq?: { q: string; a: string }[];
}

function toDraft(c: CatDoc): SeoDraft {
  return {
    seoTitle: c.seoTitle ?? "",
    seoDescription: c.seoDescription ?? "",
    description: c.description ?? "",
    seoContent: c.seoContent ?? "",
    faq: (c.faq ?? []).map((f) => ({ q: f.q, a: f.a }))
  };
}

const FIELD_SPEC: Record<SeoField, string> = {
  seoTitle: `"seoTitle": عنوان سئو، طبیعی و منحصربه‌فرد، حداکثر ۶۰ تا ۷۰ کاراکتر. نام «${site.name}» را نیاور (خودکار اضافه می‌شود).`,
  seoDescription: `"seoDescription": توضیح متا برای نتایج گوگل، حدود ۱۵۰ تا ۱۷۰ کاراکتر، جذاب و طبیعی، بدون ادعای اثبات‌نشدنی.`,
  description: `"description": ۲۰۰ تا ۴۰۰ کاراکتر، یک تا سه جمله برای خود کاربر؛ این دسته دقیقاً چیست و چه کسی/چه نیازی به آن مراجعه می‌کند.`,
  seoContent: `"seoContent": متن کامل و مفید، حدود ۳۰۰ تا ۶۰۰ کلمه. بخش‌ها با خطی که با «## » شروع می‌شود جدا شوند؛ پاراگراف‌ها با یک خط خالی. فقط همین یک سطح عنوان؛ بدون **، بدون لیست مارک‌داون، بدون HTML.`,
  faq: `"faq": آرایه‌ی ۳ تا ۵ مورد {"q":"...","a":"..."}؛ سوال‌هایی که خریدار این دسته واقعاً می‌پرسد؛ پاسخ ۱ تا ۳ جمله، متن ساده.`
};

function buildPrompts(args: {
  cat: CatDoc;
  path: string;
  children: string[];
  siblings: { name: string; seoTitle?: string }[];
  fields: SeoField[];
  existing: SeoDraft;
  repairErrors?: string[];
}) {
  const { cat, path, children, siblings, fields, existing, repairErrors } = args;
  const kept = SEO_FIELDS.filter((f) => !fields.includes(f));

  const system = [
    `تو یک نویسنده‌ی حرفه‌ای محتوای سئوی فارسی هستی و برای «${site.name}» می‌نویسی.`,
    `درباره‌ی پلتفرم فقط همین را می‌دانی و فقط همین را می‌توانی بگویی: ${site.description}`,
    `روش کار به زبان ساده: خریدار درخواست خرید ثبت می‌کند، فروشندگان روی آن قیمت پیشنهاد می‌دهند و خریدار یکی را انتخاب می‌کند.`,
    ``,
    `قواعد:`,
    `- فارسی روان و طبیعی؛ برای کاربر بنویس، نه برای ربات.`,
    `- کلمه‌ی کلیدی اصلی (نام دسته) را طبیعی و کم به کار ببر؛ تکرار پشت‌سرهم و keyword stuffing ممنوع.`,
    `- هیچ آمار، قیمت، درصد، تعداد فروشنده/مشتری، سابقه یا ادعای اثبات‌نشدنی نساز. واژه‌هایی مثل «ارزان‌ترین»، «بهترین قیمت»، «تضمین» ممنوع.`,
    `- درباره‌ی خود کالا/خدمت فقط اطلاعات عمومی و درست بگو (کاربرد، معیارهای انتخاب، نکات خرید). مطمئن نیستی؟ نگو.`,
    `- محتوا باید به موضوع و نیت جست‌وجوی خودِ همین دسته بپردازد و با دسته‌های هم‌سطح تفاوت واضح داشته باشد؛ جمله‌ی قالبی مشترک بین دسته‌ها ننویس.`,
    `- فقط یک شیء JSON معتبر برگردان؛ هیچ متن، توضیح یا بلاک کد اضافه نیاور.`
  ].join("\n");

  const lines = [
    `دسته‌ی هدف: «${cat.name}»`,
    `نامک (slug): ${cat.slug}`,
    `مسیر در ساختار سایت: ${path}`,
    children.length ? `زیردسته‌ها: ${children.join("، ")}` : `زیردسته‌ای ندارد (دسته‌ی نهایی است).`,
    siblings.length
      ? `دسته‌های هم‌سطح (محتوایت باید از این‌ها متمایز باشد):\n${siblings
          .map((s) => `- ${s.name}${s.seoTitle ? ` (عنوان سئو: ${s.seoTitle})` : ""}`)
          .join("\n")}`
      : `دسته‌ی هم‌سطحی ندارد.`
  ];
  if (kept.length) {
    lines.push(
      `\nاین فیلدها را قبلاً مدیر نوشته؛ تولیدشان نکن ولی با آن‌ها هماهنگ باش:`,
      JSON.stringify(
        Object.fromEntries(kept.map((f) => [f, (existing as any)[f]])),
        null,
        1
      )
    );
  }
  lines.push(
    `\nفقط این فیلدها را تولید کن:`,
    ...fields.map((f) => FIELD_SPEC[f]),
    `\nخروجی: {${fields.map((f) => `"${f}": ...`).join(", ")}}`
  );
  if (repairErrors?.length) {
    lines.push(`\nخروجی قبلی این ایرادها را داشت؛ اصلاح کن:\n- ${repairErrors.join("\n- ")}`);
  }
  return { system, user: lines.join("\n") };
}

function parseJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ---- main entry ----------------------------------------------------------

export async function generateCategorySeo(
  categoryId: string,
  mode: "fill" | "rewrite"
): Promise<GenerateSeoResult> {
  await connectToDatabase();
  const all = (await Category.find().lean()) as unknown as CatDoc[];
  const byId = new Map(all.map((c) => [String(c._id), c]));
  const cat = byId.get(categoryId);
  if (!cat) return { ok: false, error: "دسته‌بندی پیدا نشد.", retryable: false };

  const existing = toDraft(cat);
  const missing = getMissingSeoFields({ ...existing, faqCount: existing.faq.length });

  let fields: SeoField[];
  if (mode === "fill") {
    if (missing.length === 0) return { ok: true, status: "skipped", reason: "SEO این دسته کامل است." };
    fields = missing;
  } else {
    fields = [...SEO_FIELDS];
  }

  // path / children / siblings from the real category tree
  const names: string[] = [cat.name];
  let cur: CatDoc | undefined = cat;
  for (let i = 0; i < 20 && cur?.parent; i++) {
    cur = byId.get(String(cur.parent));
    if (!cur) break;
    names.unshift(cur.name);
  }
  const children = all.filter((c) => String(c.parent ?? "") === categoryId).map((c) => c.name);
  const siblingDocs = all
    .filter((c) => String(c._id) !== categoryId && String(c.parent ?? "") === String(cat.parent ?? ""))
    .slice(0, 15);
  const siblings = siblingDocs.map((s) => ({ name: s.name, seoTitle: s.seoTitle }));

  let repairErrors: string[] | undefined;
  let model = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { system, user } = buildPrompts({
      cat,
      path: names.join(" > "),
      children,
      siblings,
      fields,
      existing,
      repairErrors
    });
    let text: string;
    try {
      const r = await generateText({ system, user, maxTokens: 4500 });
      text = r.text;
      model = r.model;
    } catch (err: any) {
      if (err instanceof AiError) return { ok: false, error: err.message, retryable: err.retryable };
      return { ok: false, error: err?.message ?? "خطای ناشناخته", retryable: true };
    }

    let parsed: any;
    try {
      parsed = parseJson(text);
    } catch {
      repairErrors = ["خروجی JSON معتبر نبود؛ فقط یک شیء JSON برگردان"];
      continue;
    }
    const v = validateSeoFields(parsed, fields);
    if (!v.ok) {
      repairErrors = v.errors;
      continue;
    }

    const draft: SeoDraft = { ...existing, ...(v.data as Partial<SeoDraft>) };
    const warnings: string[] = [];
    const generatedText = [v.data.seoTitle, v.data.seoDescription, v.data.description, v.data.seoContent]
      .filter(Boolean)
      .join(" ");
    for (const r of RISKY) if (r.re.test(generatedText + JSON.stringify(v.data.faq ?? []))) warnings.push(r.msg);

    const mine = trigrams(`${draft.description} ${draft.seoContent}`);
    for (const s of siblingDocs) {
      const sim = jaccard(mine, trigrams(`${s.description ?? ""} ${s.seoContent ?? ""}`));
      if (sim > 0.3) warnings.push(`شباهت زیاد متن با دسته‌ی «${s.name}» (${Math.round(sim * 100)}٪)`);
    }

    return { ok: true, status: "generated", draft, existing, generatedFields: fields, warnings, model };
  }
  return {
    ok: false,
    error: `خروجی هوش مصنوعی معتبر نبود: ${(repairErrors ?? []).join("؛ ")}`,
    retryable: true
  };
}
