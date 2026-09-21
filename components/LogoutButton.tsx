"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="خروج از حساب"
      title="خروج از حساب"
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <LogOut className="h-4.5 w-4.5" />}
    </button>
  );
}
