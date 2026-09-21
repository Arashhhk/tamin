"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Suggestion from "@/models/Suggestion";

export async function markSuggestionReadAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  await Suggestion.findByIdAndUpdate(id, { status: "read" });

  revalidatePath("/admin/suggestions");
}

export async function deleteSuggestionAction(formData: FormData) {
  await requireAdmin();
  await connectToDatabase();

  const id = String(formData.get("id") || "");
  await Suggestion.findByIdAndDelete(id);

  revalidatePath("/admin/suggestions");
}
