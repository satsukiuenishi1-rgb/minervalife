import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

export const CURRENCIES = [
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", symbol: "₩", locale: "ko-KR" },
  { code: "TWD", symbol: "NT$", locale: "zh-TW" },
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "ARS", symbol: "$", locale: "es-AR" },
  { code: "ZAR", symbol: "R", locale: "en-ZA" },
];

export function currencyMeta(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatMoney(amount, currencyCode) {
  const meta = currencyMeta(currencyCode);
  const fractionDigits = ["JPY", "KRW"].includes(meta.code) ? 0 : 2;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(fractionDigits)}`;
  }
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function friendlyDate(iso) {
  const d = parseISO(iso);
  if (isToday(d)) return "今日";
  if (isTomorrow(d)) return "明日";
  if (isYesterday(d)) return "昨日";
  return format(d, "M月d日 (EEE)");
}

export function weekRangeISO(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function isWithin(iso, start, end) {
  const d = parseISO(iso);
  return d >= start && d <= end;
}
