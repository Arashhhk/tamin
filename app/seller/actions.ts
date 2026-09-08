"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/current-user";
import User from "@/models/User";

export async function acceptSellerTermsAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "seller") {
    throw new Error("این عملیات فقط برای فروشندگان است.");
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(user._id, { sellerTermsAcceptedAt: new Date() });

  revalidatePath("/", "layout");
}
