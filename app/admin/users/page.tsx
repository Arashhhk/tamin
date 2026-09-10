import type { Metadata } from "next";
import { getAllUsersForAdmin } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import UserRow from "./UserRow";

export const metadata: Metadata = { title: "کاربران | ادمین", robots: { index: false } };
export default async function AdminUsersPage() {
  const allUsers = await getAllUsersForAdmin();

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">کاربران ({formatNumber(allUsers.length)})</h1>
      </div>
      <section className="overflow-x-auto rounded-xl2 border border-line bg-white shadow-card">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-400">
              <th className="px-4 py-3 font-bold">نام</th>
              <th className="px-4 py-3 font-bold">ایمیل</th>
              <th className="px-4 py-3 font-bold">نقش</th>
              <th className="px-4 py-3 font-bold">شهر</th>
              <th className="px-4 py-3 font-bold">امتیاز</th>
              <th className="px-4 py-3 font-bold">اخطارها</th>
              <th className="px-4 py-3 font-bold">وضعیت</th>
              <th className="px-4 py-3 font-bold">اقدام</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <UserRow key={u.id} user={u as any} />
            ))}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-400">
                  کاربری یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
