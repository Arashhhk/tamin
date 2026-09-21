"use client";

import { useState, useTransition } from "react";
import {
  Gavel,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Ban,
  MessageSquareWarning
} from "lucide-react";
import { acceptSellerTermsAction } from "@/app/seller/actions";

export default function SellerTermsModal() {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    if (!checked) return;
    setError(null);
    startTransition(async () => {
      try {
        await acceptSellerTermsAction();
      } catch (err: any) {
        setError(err.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-terms-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white shadow-2xl">
        <div className="rounded-t-xl2 bg-gradient-to-l from-camel-600 to-camel-500 p-6 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Gavel className="h-5 w-5" />
          </span>
          <h2 id="seller-terms-title" className="mt-3 text-lg font-extrabold">
            خوش آمدید، فروشنده گرامی
          </h2>
          <p className="mt-1 text-sm text-white/90">
            پیش از شروع فعالیت، لطفاً قوانین زیر را با دقت بخوانید.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <section>
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-ink-900">
              <Gavel className="h-4 w-4 text-camel-500" />
              روند مزایده
            </h3>
            <p className="text-xs leading-6 text-ink-600">
              روی درخواست‌های خرید باز، قیمت پیشنهاد می‌دهید. خریدار
              پیشنهادها را می‌بیند (بدون نام شما) و بهترین را انتخاب
              می‌کند. با انتخاب شما، اطلاعات تماس خریدار در اختیارتان قرار
              می‌گیرد و باید هماهنگ برای تحویل کالا اقدام کنید.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-ink-900">
              <AlertTriangle className="h-4 w-4 text-camel-500" />
              قیمت‌گذاری واقعی الزامی است
            </h3>
            <p className="text-xs leading-6 text-ink-600">
              اگر قیمت پیشنهادی شما کمتر از{" "}
              <strong className="text-ink-900">۷۰٪ میانگین</strong> سایر
              پیشنهادهای همان درخواست باشد، به‌صورت خودکار به‌عنوان
              «پیشنهاد مشکوک» علامت‌گذاری و یک اخطار برای حساب شما ثبت
              می‌شود.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-ink-900">
              <Clock className="h-4 w-4 text-camel-500" />
              تعهد به تحویل
            </h3>
            <p className="text-xs leading-6 text-ink-600">
              اگر در یک مزایده برنده شوید و ظرف{" "}
              <strong className="text-ink-900">۵ روز</strong> تحویل کالا را
              تایید نکنید، این مورد هم به‌عنوان تخلف ثبت می‌شود. خریداران
              نیز می‌توانند عدم تحویل را گزارش دهند.
            </p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-ink-900">
              <ShieldAlert className="h-4 w-4 text-camel-500" />
              سیستم اخطار سه‌مرحله‌ای
            </h3>
            <ul className="space-y-2 text-xs text-ink-600">
              <li className="flex items-start gap-2 rounded-lg bg-camel-50 p-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-camel-500 text-[10px] font-extrabold text-white">
                  ۱
                </span>
                <span>
                  <strong className="text-ink-900">اخطار اول:</strong> هشدار
                  + کاهش نمایش در فهرست «برترین فروشندگان» به مدت ۷ روز.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-camel-50 p-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-camel-500 text-[10px] font-extrabold text-white">
                  ۲
                </span>
                <span>
                  <strong className="text-ink-900">اخطار دوم:</strong> تعلیق
                  خودکار حساب به مدت ۱۴ روز.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-danger/10 p-2.5">
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>
                  <strong className="text-ink-900">اخطار سوم به بعد:</strong>{" "}
                  پرونده برای بررسی نهایی نزد مدیریت ارسال می‌شود و در صورت
                  تایید، حساب به‌طور دائم مسدود خواهد شد.
                </span>
              </li>
            </ul>
          </section>

          <section className="flex items-start gap-2 rounded-lg border border-line bg-sand p-3 text-xs text-ink-500">
            <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-camel-500" />
            هدف این قوانین حفظ اعتماد خریداران و فروشندگان درست‌کار روی
            پلتفرم پله است.
          </section>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 has-[:checked]:border-camel-400 has-[:checked]:bg-camel-50">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-camel-500"
            />
            <span className="text-xs font-bold text-ink-800">
              شرایط و قوانین بالا را به‌طور کامل خواندم و می‌پذیرم.
            </span>
          </label>

          {error && <p className="text-xs font-bold text-danger">{error}</p>}

          <button
            onClick={handleAccept}
            disabled={!checked || isPending}
            className="w-full rounded-lg bg-camel-500 py-3 text-sm font-bold text-white transition hover:bg-camel-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "در حال ثبت..." : "مرحله بعد"}
          </button>
        </div>
      </div>
    </div>
  );
}
