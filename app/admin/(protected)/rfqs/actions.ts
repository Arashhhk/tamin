"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Rfq from "@/models/Rfq";

export async function cancelRfqAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  const rfq = await Rfq.findById(id);
  if (!rfq) throw new Error("درخواست یافت نشد");
  if (rfq.status === "completed") throw new Error("درخواست تکمیل‌شده قابل لغو نیست");

  rfq.status = "cancelled";
  await rfq.save();

  revalidatePath("/admin/rfqs");
  revalidatePath("/rfq");
  revalidatePath("/");
}
