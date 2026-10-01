/**
 * Minimal, server-only AI text-generation client.
 *
 * Provider: Google Gemini API (Google AI Studio — has a free tier).
 * Called with plain fetch, so no SDK dependency is added to the project.
 *
 * Env (never exposed to the browser; this file is only imported by
 * server actions / server code):
 *   GEMINI_API_KEY   (or AI_API_KEY)  required — free key from
 *                    https://aistudio.google.com/apikey
 *   AI_MODEL         optional, default "gemini-flash-latest" (always the
 *                    current Flash model; "gemini-flash-lite-latest" has
 *                    higher free-tier limits)
 *   AI_PROXY_URL     optional, e.g. http://127.0.0.1:10809 — the local HTTP
 *                    proxy of your VPN app. Needed in local development
 *                    because Node does NOT use the VPN you connect on
 *                    Windows (browsers do; Node doesn't). Requires `npm i`
 *                    (the "undici" package is already in package.json).
 *   AI_BASE_URL      optional, default "https://generativelanguage.googleapis.com"
 *                    (point it at a proxy if Google's endpoint isn't
 *                    reachable from your server)
 */

export class AiError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
    this.name = "AiError";
  }
}

function apiKey() {
  return (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
}

export function isAiConfigured(): boolean {
  return Boolean(apiKey());
}

export function aiModelName(): string {
  return process.env.AI_MODEL || "gemini-flash-latest";
}

let proxyAgent: any;
/**
 * fetch that goes through AI_PROXY_URL when set (using undici's own fetch
 * together with its own ProxyAgent, so the two always match); plain fetch
 * otherwise. Exported so scripts/test-ai.ts can check the real exit IP.
 */
export async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  const proxy = (process.env.AI_PROXY_URL || "").trim();
  if (!proxy) return fetch(url, init);
  try {
    const name = "undici";
    const undici: any = await import(/* webpackIgnore: true */ name);
    proxyAgent = proxyAgent ?? new undici.ProxyAgent(proxy);
    return (await undici.fetch(url, { ...(init as any), dispatcher: proxyAgent })) as Response;
  } catch (err: any) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" || /Cannot find (module|package)/i.test(err?.message ?? "")) {
      throw new AiError("AI_PROXY_URL تنظیم شده ولی بسته‌ی undici نصب نیست؛ یک‌بار «npm install» بزنید.", false);
    }
    throw err;
  }
}

const PER_ATTEMPT_TIMEOUT_MS = 40_000;
const TOTAL_DEADLINE_MS = 55_000; // stay under typical serverless action limits
const MAX_ATTEMPTS = 2;

export async function generateText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const key = apiKey();
  if (!key) {
    throw new AiError("کلید Gemini تنظیم نشده است (GEMINI_API_KEY در فایل .env).", false);
  }
  const base = (process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const model = aiModelName();
  const startedAt = Date.now();
  let lastError: AiError = new AiError("خطای ناشناخته در ارتباط با Gemini", true);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remaining = TOTAL_DEADLINE_MS - (Date.now() - startedAt);
    if (remaining < 5_000) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining));
    let waitBeforeRetryMs = 1500;
    try {
      const res = await aiFetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key // header, not ?key= → never ends up in URLs/logs
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts: [{ text: opts.user }] }],
          generationConfig: {
            temperature: opts.temperature ?? 0.7,
            // Gemini 2.5 models may spend part of this budget on internal
            // "thinking", so it's set generously.
            maxOutputTokens: Math.max(opts.maxTokens ?? 0, 8192),
            responseMimeType: "application/json"
          }
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data?.promptFeedback?.blockReason) {
          throw new AiError(`درخواست توسط Gemini مسدود شد (${data.promptFeedback.blockReason}).`, false);
        }
        const cand = data?.candidates?.[0];
        const text = (cand?.content?.parts ?? [])
          .filter((p: any) => typeof p?.text === "string" && !p?.thought)
          .map((p: any) => p.text)
          .join("");
        if (!text) {
          const why = cand?.finishReason ? ` (${cand.finishReason})` : "";
          throw new AiError(`پاسخ خالی از Gemini${why}`, cand?.finishReason !== "SAFETY");
        }
        return { text, model };
      }

      // Read the raw body: Google's JSON error normally has a message, but a
      // region/firewall block can return HTML or an empty body instead.
      let detail = "";
      let rawBody = "";
      try {
        rawBody = await res.text();
        detail = JSON.parse(rawBody)?.error?.message ?? "";
      } catch {
        detail = rawBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
      }
      const nonJson = !detail || !rawBody.trim().startsWith("{");
      const retryable = res.status === 429 || res.status >= 500;
      let msg: string;
      if (res.status === 429) {
        msg = "سقف درخواست رایگان Gemini پر شده؛ چند دقیقه صبر کنید و دوباره تلاش کنید.";
        waitBeforeRetryMs = 8000;
      } else if (res.status === 400 && /api key/i.test(detail)) {
        msg = "کلید Gemini نامعتبر است.";
      } else if (res.status === 400 && /location/i.test(detail)) {
        msg = "Gemini از این کشور/آی‌پی پشتیبانی نمی‌شود؛ سرور یا پروکسی خارج از ایران لازم است.";
      } else if (res.status === 401 || res.status === 403) {
        // Show Google's own reason (it never contains the key) plus a hint,
        // because 403 has several very different causes.
        let hint: string;
        if (/location|region|country/i.test(detail)) {
          hint = "Gemini از این کشور/آی‌پی پشتیبانی نمی‌شود؛ سرور یا پروکسی خارج از ایران لازم است.";
        } else if (/leak/i.test(detail)) {
          hint = "گوگل این کلید را «لو رفته» اعلام و غیرفعال کرده؛ در AI Studio یک کلید جدید بسازید.";
        } else if (/has not been used|disabled|SERVICE_DISABLED/i.test(detail)) {
          hint = "Generative Language API برای پروژه‌ی این کلید فعال نیست؛ کلید را از aistudio.google.com/apikey و با «Create API key in new project» بسازید.";
        } else if (/blocked|restrict|referer|referrer|IP address/i.test(detail)) {
          hint = "کلید محدودیت (API/IP/Referrer) دارد؛ در Google Cloud محدودیت‌ها را بردارید یا کلید بدون محدودیت از AI Studio بسازید.";
        } else if (nonJson) {
          // No JSON error from Google → the request almost certainly never
          // reached the API as a normal authenticated call.
          hint = process.env.AI_PROXY_URL
            ? "پاسخ بدون پیام خطای گوگل است؛ احتمالاً آی‌پی/منطقه‌ی خروجی VPN مسدود است. کشور VPN را عوض کنید (مثلاً آمریکا/آلمان/هلند)."
            : "پاسخ بدون پیام خطای گوگل است؛ معمولاً یعنی Node از VPN شما استفاده نمی‌کند (مرورگر می‌کند، Node نه). AI_PROXY_URL را در .env.local تنظیم کنید یا VPN را در حالت tunnel/TUN اجرا کنید.";
        } else {
          hint = "کلید را بررسی کنید (کپی کامل، بدون فاصله/گیومه، و ساخته‌شده در AI Studio).";
        }
        msg = `دسترسی رد شد (${res.status}). ${hint}${detail ? ` | پاسخ گوگل: ${detail.slice(0, 220)}` : ""}`;
      } else if (res.status === 404) {
        msg = `مدل «${model}» پیدا نشد؛ AI_MODEL را بررسی کنید.`;
      } else {
        msg = `خطای Gemini (${res.status})${detail ? `: ${detail}` : ""}`;
      }
      lastError = new AiError(msg, retryable);
      if (!retryable) throw lastError;
    } catch (err: any) {
      if (err instanceof AiError) {
        lastError = err;
        if (!err.retryable) throw err;
      } else if (err?.name === "AbortError") {
        lastError = new AiError("پاسخ Gemini بیش از حد طول کشید.", true);
      } else {
        lastError = new AiError(`اتصال به Gemini برقرار نشد (${err?.message ?? "network"}).`, true);
      }
    } finally {
      clearTimeout(timer);
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, waitBeforeRetryMs));
  }
  throw lastError;
}
