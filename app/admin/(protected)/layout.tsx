import Link from "next/link";
import { redirect } from "next/navigation";
import { Gavel, LayoutDashboard, Users, FileText, Layers, Settings, ShieldAlert, MessageSquarePlus } from "lucide-react";
import { getPendingViolations, getUnreadSuggestionsCount } from "@/lib/queries";
import { sweepOverdueDeliveries } from "@/lib/violations";
import { getAdminSession } from "@/lib/admin-auth";
import { adminLogoutAction } from "./logout-action";
import AdminLogoutButton from "./AdminLogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates every /admin/* request,
  // but this route group's own layout re-checks the env-based admin
  // session server-side too — the same pattern used everywhere else in
  // this app (see app/profile/layout.tsx checking getCurrentUser()).
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  await sweepOverdueDeliveries().catch((err) => console.error("sweepOverdueDeliveries failed:", err));
  const [pendingViolations, unreadSuggestions] = await Promise.all([
    getPendingViolations(),
    getUnreadSuggestionsCount()
  ]);

  const navItems = [
    { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
    { href: "/admin/rfqs", label: "درخواست‌های خرید", icon: FileText },
    { href: "/admin/users", label: "کاربران", icon: Users },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: Layers },
    {
      href: "/admin/violations",
      label: "پرونده‌های تخلف",
      icon: ShieldAlert,
      badge: pendingViolations.length
    },
    {
      href: "/admin/suggestions",
      label: "پیشنهادات کاربران",
      icon: MessageSquarePlus,
      badge: unreadSuggestions
    },
    { href: "/admin/settings", label: "تنظیمات", icon: Settings }
  ];

  return (
    <div className="flex min-h-screen bg-sand">
      <aside className="hidden w-60 shrink-0 flex-col border-l border-line bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-camel-500 text-white">
            <Gavel className="h-4 w-4" />
          </span>
          <span className="font-extrabold text-ink-900">پنل ادمین پله</span>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-ink-600 hover:bg-camel-50 hover:text-camel-700"
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {"badge" in item && item.badge! > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-extrabold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <form action={adminLogoutAction} className="mt-auto border-t border-line p-3">
          <AdminLogoutButton />
        </form>
      </aside>
      <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
