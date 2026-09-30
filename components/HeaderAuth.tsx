"use client";

import Link from "next/link";
import { Bell, Mail } from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";
import LogoutButton from "./LogoutButton";
import SellerTermsModal from "./SellerTermsModal";
import { logoutAction } from "@/app/(auth)/actions";

const roleLabels: Record<string, string> = { buyer: "خریدار", seller: "فروشنده", admin: "ادمین" };

export default function HeaderAuth() {
  const user = useCurrentUser();

  // Not known yet this render (no cache, fetch still in flight) —
  // render an empty, roughly-sized placeholder rather than guessing
  // guest or logged-in. A blank slot for a moment is far safer than
  // ever showing "ورود" to someone who's actually logged in, or vice
  // versa, even for a single frame.
  if (user === undefined) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-ink-700 hover:bg-camel-50">
          ورود
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-camel-500 px-3 py-2 text-sm font-bold text-white hover:bg-camel-600"
        >
          ثبت‌نام
        </Link>
      </div>
    );
  }

  const needsSellerTerms = user.role === "seller" && !user.sellerTermsAcceptedAt;

  return (
    <>
      {needsSellerTerms && <SellerTermsModal />}
      <button
        type="button"
        aria-label="اعلان‌ها"
        className="relative hidden rounded-full p-2 text-ink-600 hover:bg-camel-50 hover:text-camel-600 sm:flex"
      >
        <Bell className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="پیام‌ها"
        className="relative hidden rounded-full p-2 text-ink-600 hover:bg-camel-50 hover:text-camel-600 sm:flex"
      >
        <Mail className="h-5 w-5" />
      </button>

      <Link
        href={user.role === "seller" ? "/seller" : user.role === "admin" ? "/admin" : "/profile"}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 hover:bg-camel-50"
      >
        <span className="hidden text-right sm:block">
          <span className="block text-sm font-bold leading-tight text-ink-900">{user.name}</span>
          <span className="block text-xs leading-tight text-ink-400">{roleLabels[user.role]}</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-camel-100 text-sm font-bold text-camel-700">
          {user.name.slice(0, 1)}
        </span>
      </Link>

      <form action={logoutAction}>
        <LogoutButton />
      </form>
    </>
  );
}
