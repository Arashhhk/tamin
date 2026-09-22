import Image from "next/image";
import Link from "next/link";
import { Gavel, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";

export default async function Hero() {
  const user = await getCurrentUser();

  // Logged-in buyer or seller: the section's `camel-*` classes already
  // repaint automatically per the active theme (see app/layout.tsx +
  // globals.css), so a single-hue gradient is enough — no conditional
  // classes needed here for that case.
  //
  // Guest (not logged in yet, hasn't picked a side): a genuine two-tone
  // gradient combining BOTH role colors — literal orange (buyer) on the
  // right, literal sky blue (seller) on the left — regardless of which
  // theme is currently active, since a guest hasn't triggered either
  // theme override. This is the concrete "combined theme" signal for
  // the one visitor group that could become either role.
  const heroGradient = user
    ? "bg-gradient-to-l from-camel-600 via-camel-500 to-camel-400"
    : "bg-gradient-to-l from-camel-600 via-[#824b9b] to-[#3a737d]";

  // Same role-aware destination as the header CTA (components/Header.tsx)
  // — this was previously hardcoded to /rfq/new, which is buyer-only;
  // a logged-in seller clicking it got silently redirected away by
  // middleware, which looked like the button "did nothing".
  const ctaHref = user?.role === "seller" ? "/seller" : "/rfq/new";
  const ctaLabel = !user
    ? "ثبت درخواست خرید یا فروش"
    : user.role === "seller"
      ? "پنل فروش"
      : "ثبت درخواست خرید";

  return (
    <section
      className={`relative overflow-hidden rounded-xl2 ${heroGradient} px-6 py-8 text-white shadow-pop sm:px-10 sm:py-10`}
    >
      {/* Signature motif: faint repeating radial marks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, white 0, transparent 45%), radial-gradient(circle at 85% 70%, white 0, transparent 40%)"
        }}
      />

      <div className="relative flex flex-col items-center justify-center gap-6 md:flex-row md:gap-8">
        <div className="flex max-w-xl flex-col items-center gap-5 text-center md:items-start md:text-right">
          <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
            <Gavel className="h-3.5 w-3.5" />
            مزایده معکوس، تأمین هوشمند
          </span>
          <h1 className="text-balance text-3xl font-extrabold leading-snug sm:text-4xl md:text-5xl">
            به پله خوش آمدید
          </h1>
          <p className="text-balance text-sm text-white/90 sm:text-base md:text-lg">
            هر چیزی که نیاز دارید را درخواست دهید؛ بهترین فروشندگان با بهترین
            قیمت برایتان مزایده می‌کنند.
          </p>
          <Link
            href={ctaHref}
            className="group mt-1 flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-extrabold text-camel-700 shadow-2xl transition hover:-translate-y-0.5 hover:bg-camel-50 sm:text-lg"
          >
            {ctaLabel}
            <ArrowLeft className="h-5 w-5 transition group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Illustration slot — see README for exact file spec.
            Wide 2:1 banner, not 4:3 — a taller box grows both width
            AND height together since the ratio is fixed, which is the
            opposite of what a "gets wider, not taller, poster-style"
            banner needs. 2:1 means every extra bit of width adds much
            less height, so scaling `max-w-*` up mainly reads as wider,
            closer to the text, without the illustration ballooning in
            height and overpowering the section. `aspect-[2/1]` drives
            the box shape. A single fixed `max-w-[32rem]` (not a
            per-breakpoint ladder) is the upper bound at every screen
            size — on narrow screens `w-full` already yields something
            smaller than 512px on its own, so this doesn't force
            overflow on mobile, it just stops growing past 32rem once
            the section is wide enough to offer that much room. Fades
            in from all four straight edges (left/right/top/bottom)
            toward the center — two linear gradients (one per axis)
            combined with mask-composite:intersect, rather than a
            single radial gradient (which fades based on diagonal
            distance from center and visibly eats into the corners
            first). Visible at every width — below `md:` the outer flex
            is `flex-col`, so it simply stacks under the text instead
            of competing with it for horizontal space. */}
        <div className="relative aspect-[2/1] w-full max-w-[32rem] shrink-0">
          <div
            className="relative h-full w-full"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
              maskComposite: "intersect"
            }}
          >
            <Image
              src="/2.png"
              alt=""
              fill
              priority
              className="object-contain"
              sizes="(min-width: 640px) 512px, 100vw"
            />
          </div>
        </div>
      </div>
{/* 
      <Gavel
        aria-hidden
        strokeWidth={1}
        className="pointer-events-none absolute -left-4 -bottom-6 hidden h-40 w-40 -rotate-12 text-white/10 sm:block"
      /> */}
    </section>
  );
}
