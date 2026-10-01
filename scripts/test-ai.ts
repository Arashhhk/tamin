/**
 * تست مستقل اتصال به Gemini — جدا از Next.js و پنل ادمین.
 * اجرا:  npm run test:ai
 * (کلید را از .env.local می‌خواند.)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { generateText, isAiConfigured, aiModelName, aiFetch } from "../lib/ai/provider";

async function main() {
  if (!isAiConfigured()) {
    console.error("GEMINI_API_KEY در .env.local پیدا نشد.");
    process.exit(1);
  }
  console.log("مدل:", aiModelName());
  console.log("پروکسی:", process.env.AI_PROXY_URL ? process.env.AI_PROXY_URL : "(تنظیم نشده)");

  // کشور خروجی همین فرایند Node (نه مرورگر) — اگر IR بود، Gemini رد می‌کند.
  try {
    const r = await aiFetch("https://ipinfo.io/json", { headers: { accept: "application/json" } });
    const j: any = await r.json();
    console.log(`آی‌پی خروجی Node: ${j.ip} — کشور: ${j.country}`);
    if (j.country === "IR") console.log("⚠ Node مستقیم از ایران وصل می‌شود؛ VPN روی آن اعمال نشده.");
  } catch (e: any) {
    console.log("تشخیص آی‌پی خروجی ممکن نشد:", e.message);
  }

  try {
    const r = await generateText({
      system: "فقط یک شیء JSON برگردان.",
      user: 'خروجی: {"ok": true, "message": "سلام"}',
      maxTokens: 100
    });
    console.log("✅ اتصال موفق. پاسخ:", r.text.trim());
  } catch (err: any) {
    console.error("❌", err.message);
    process.exit(1);
  }
}
main();
