import Link from "next/link";
import { FileEdit, Users, CheckCircle2, PackageCheck, ArrowLeft } from "lucide-react";

const steps = [
  { icon: FileEdit, title: "ثبت درخواست خرید", body: "نیاز خود را با جزئیات ثبت می‌کنید." },
  { icon: Users, title: "دریافت پیشنهاد", body: "فروشندگان مختلف قیمت پیشنهاد می‌دهند." },
  { icon: CheckCircle2, title: "انتخاب بهترین پیشنهاد", body: "بهترین گزینه را انتخاب می‌کنید." },
  { icon: PackageCheck, title: "هماهنگی و تحویل", body: "با فروشنده هماهنگ و معامله تکمیل می‌شود." }
];

export default function HowItWorksSection() {
  return (
    <div className="rounded-xl2 border border-camel-200 bg-camel-50 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-camel-500 text-white shadow-pop">
              <step.icon className="h-6 w-6" />
            </span>
            <span className="num absolute -top-1 right-1/2 flex h-6 w-6 translate-x-8 items-center justify-center rounded-full bg-white text-xs font-extrabold text-camel-600 shadow-card">
              {i + 1}
            </span>
            <h3 className="text-sm font-extrabold text-ink-900">{step.title}</h3>
            <p className="text-xs leading-6 text-ink-600">{step.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          href="/how-it-works"
          className="flex items-center gap-1.5 rounded-lg bg-camel-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-camel-600"
        >
          راهنمای کامل
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
