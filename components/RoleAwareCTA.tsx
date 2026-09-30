"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCurrentUser } from "@/lib/use-current-user";

/**
 * See components/HeaderAuth.tsx for the general pattern/rationale.
 * This drives the "ثبت درخواست..." button's href + label in three
 * places (Header desktop, Header mobile, Hero).
 *
 * IMPORTANT: `icon` is a plain ReactNode prop (an already-created
 * element, e.g. `<PlusCircle className="h-4 w-4" />`), NOT a
 * render-prop function. A Server Component (Header.tsx, Hero.tsx) can
 * only pass serializable values across to a Client Component like
 * this one — a JSX element is fine, but a function (e.g.
 * `children={(label) => <>...}`) is not, and throws exactly the
 * "Functions are not valid as a child of Client Components" error at
 * runtime. This got that wrong on the first pass; this is the fix.
 *
 * Only the seller case actually changes the href (see the original
 * comment this was extracted from in Header.tsx) — guest and buyer
 * both go to /rfq/new, so the "unknown yet" and "guest" states
 * intentionally render the SAME safe default a buyer would also want:
 * the only moment this could ever be "wrong" is for a seller on first
 * paint, who'd briefly see the buyer-facing label before this
 * corrects itself right after mount.
 */
export default function RoleAwareCTA({
  className,
  icon,
  iconPosition = "before"
}: {
  className: string;
  icon: ReactNode;
  iconPosition?: "before" | "after";
}) {
  const user = useCurrentUser();

  const isSeller = user && user.role === "seller";
  const href = isSeller ? "/seller" : "/rfq/new";
  const label =
    user === undefined || !user
      ? "ثبت درخواست خرید یا فروش"
      : isSeller
        ? "ثبت درخواست فروش"
        : "ثبت درخواست خرید";

  return (
    <Link href={href} className={className}>
      {iconPosition === "before" && icon}
      {label}
      {iconPosition === "after" && icon}
    </Link>
  );
}
