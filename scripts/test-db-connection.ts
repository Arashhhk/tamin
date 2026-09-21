/**
 * تست مستقل اتصال به MongoDB — کاملاً جدا از Next.js.
 *
 * هدف: مشخص کردن اینکه خطای `querySrv ECONNREFUSED` از کجا میاد:
 *   ۱. از DNS/شبکه‌ی سیستم شما (احتمال خیلی بالا)
 *   ۲. از خودِ Mongoose/تنظیمات پروژه (احتمال پایین، ولی این اسکریپت محک می‌زنه)
 *
 * اجرا:
 *   npx tsx scripts/test-db-connection.ts
 *
 * این اسکریپت هیچ وابستگی‌ای به Next.js ندارد؛ اگر همینجا هم fail بشه،
 * قطعی می‌شود مشکل از DNS/شبکه‌ی محیط شماست، نه از کد پروژه.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import dns from "dns";
import mongoose from "mongoose";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

function ok(msg: string) {
  console.log(`${GREEN}✔${RESET} ${msg}`);
}
function fail(msg: string) {
  console.log(`${RED}✘${RESET} ${msg}`);
}
function warn(msg: string) {
  console.log(`${YELLOW}⚠${RESET} ${msg}`);
}
function section(title: string) {
  console.log(`\n${BOLD}${title}${RESET}`);
}

async function main() {
  section("۱. بررسی وجود و ساختار MONGODB_URI (بدون چاپ مقدار حساس)");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    fail("MONGODB_URI در .env.local تنظیم نشده است.");
    process.exit(1);
  }
  ok("MONGODB_URI تنظیم شده است.");

  let parsed: URL;
  try {
    // mongodb+srv:// و mongodb:// هر دو با URL قابل‌پارس هستند.
    parsed = new URL(uri);
  } catch {
    fail("MONGODB_URI یک URL معتبر نیست (فرمت اشتباه).");
    process.exit(1);
  }

  const isSrv = parsed.protocol === "mongodb+srv:";
  console.log(`  پروتکل: ${parsed.protocol} ${isSrv ? "(SRV — نیاز به DNS SRV lookup دارد)" : "(استاندارد — بدون SRV lookup)"}`);
  console.log(`  هاست: ${parsed.hostname}`);
  console.log(`  دیتابیس: ${parsed.pathname.replace("/", "") || "(مشخص نشده در URI)"}`);
  if (!parsed.username || !parsed.password) {
    warn("نام کاربری یا رمز عبور در URI یافت نشد — بررسی کنید فرمت درست باشد.");
  } else {
    ok("نام کاربری و رمز عبور در URI موجودند (مقدارشان چاپ نمی‌شود).");
  }

  if (!isSrv) {
    warn("این URI از نوع SRV نیست، پس آزمایش DNS SRV زیر رد می‌شود.");
  } else {
    section("۲. تست مستقیم DNS SRV lookup (جدا از Mongoose)");
    const srvName = `_mongodb._tcp.${parsed.hostname}`;
    console.log(`  در حال query: ${srvName}`);
    try {
      const records = await dns.promises.resolveSrv(srvName);
      ok(`DNS SRV lookup موفق بود — ${records.length} رکورد یافت شد.`);
      records.forEach((r, i) => console.log(`    ${i + 1}. ${r.name}:${r.port}`));
    } catch (err: any) {
      fail(`DNS SRV lookup ناموفق بود: ${err.code || err.message}`);
      console.log(`
  ${BOLD}نتیجه‌گیری:${RESET} این خطا دقیقاً همان "querySrv ECONNREFUSED" است که
  گزارش کرده بودید. این اسکریپت کاملاً مستقل از Next.js و Mongoose است، پس
  این یعنی مشکل از DNS/شبکه‌ی سیستم شماست، نه از کد پروژه:

    - فایروال، آنتی‌ویروس، یا VPN شما ممکن است پرس‌وجوهای DNS از نوع SRV
      را مسدود کرده باشد.
    - اگر روی WSL/Docker هستید، تنظیمات DNS داخل آن محیط ممکن است با
      شبکه‌ی هاست هماهنگ نباشد.
    - شبکه‌ی محل کار/دانشگاه ممکن است این نوع پرس‌وجو را مسدود کند.

  راه‌حل‌ها را در README (بخش «رفع خطای querySrv ECONNREFUSED») ببینید.
`);
      process.exit(1);
    }
  }

  section("۳. تست اتصال واقعی Mongoose (شبیه‌سازی lib/mongodb.ts)");
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000
    });
    ok("اتصال Mongoose موفق بود.");
    const state = mongoose.connection.readyState;
    console.log(`  وضعیت اتصال: ${state === 1 ? "متصل (1)" : state}`);
    await mongoose.disconnect();
    ok("اتصال با موفقیت بسته شد.");
    console.log(`\n${GREEN}${BOLD}نتیجه: همه‌چیز سالم است. مشکل از کد پروژه نبود.${RESET}`);
  } catch (err: any) {
    fail(`اتصال Mongoose ناموفق بود: ${err.message}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
