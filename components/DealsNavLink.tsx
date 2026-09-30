"use client";

import Link from "next/link";
import { useCurrentUser } from "@/lib/use-current-user";

export default function DealsNavLink() {
  const user = useCurrentUser();
  if (!user || (user.role !== "buyer" && user.role !== "seller")) return null;

  return (
    <Link href="/deals" className="whitespace-nowrap text-xs font-bold text-ink-600 transition hover:text-camel-600">
      معاملات
    </Link>
  );
}
