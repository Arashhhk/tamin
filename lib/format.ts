const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

export function formatToman(amount: number): string {
  return `${toFaDigits(amount.toLocaleString("en-US"))} تومان`;
}

export function formatNumber(amount: number): string {
  return toFaDigits(amount.toLocaleString("en-US"));
}

export function timeRemaining(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "پایان یافته";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه مانده`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت مانده`;
  const days = Math.floor(hours / 24);
  return `${toFaDigits(days)} روز مانده`;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${toFaDigits(days)} روز پیش`;
}
