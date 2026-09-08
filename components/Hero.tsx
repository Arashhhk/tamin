import Image from "next/image";
import Link from "next/link";
import { Gavel, ArrowLeft } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-xl2 bg-gradient-to-l from-camel-600 via-camel-500 to-camel-400 px-6 py-10 text-white shadow-pop sm:px-10 sm:py-14">
      {/* Signature motif: faint repeating radial marks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, white 0, transparent 45%), radial-gradient(circle at 85% 70%, white 0, transparent 40%)"
        }}
      />

      <div className="relative flex items-center justify-between gap-6">
        <div className="flex max-w-xl flex-col items-start gap-5">
          <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
            <Gavel className="h-3.5 w-3.5" />
            مزایده معکوس، تأمین هوشمند
          </span>
          <h1 className="text-balance text-2xl font-extrabold leading-snug sm:text-4xl">
            به تامین خوش آمدید
          </h1>
          <p className="text-balance text-sm text-white/90 sm:text-base">
            هر چیزی که نیاز دارید را درخواست دهید؛ بهترین فروشندگان با بهترین
            قیمت برایتان مزایده می‌کنند.
          </p>
          <Link
            href="/rfq/new"
            className="group flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-camel-700 shadow-lg transition hover:bg-camel-50"
          >
            ثبت درخواست خرید
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          </Link>
        </div>

        {/* Illustration slot — see README for exact file spec.
            Hidden on small screens so it never competes with the text. */}
        <div className="relative hidden h-72 w-72 shrink-0 md:block lg:h-80 lg:w-80">
          <Image
            src="/hero-illustration.png"
            alt=""
            fill
            priority
            className="object-contain drop-shadow-2xl"
            sizes="(min-width: 1024px) 320px, 288px"
          />
        </div>
      </div>

      <Gavel
        aria-hidden
        strokeWidth={1}
        className="pointer-events-none absolute -left-4 -bottom-6 hidden h-40 w-40 -rotate-12 text-white/10 sm:block"
      />
    </section>
  );
}
