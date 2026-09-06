import { Category } from "@/types";
import { CATEGORY_KEYWORDS, getCurrencyMeta } from "./constants";

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Integer-cents arithmetic to avoid floating point currency drift.
export const toCents = (n: number): number => Math.round((Number(n) || 0) * 100);
export const fromCents = (c: number): number => c / 100;
export const sumCents = (nums: number[]): number => nums.reduce((acc, n) => acc + toCents(n), 0);

export function formatMoney(amount: number, currencyCode = "INR", decimals = 0): string {
  const meta = getCurrencyMeta(currencyCode);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${meta.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export function startOfDay(d: Date | string): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Monday-start week
export function startOfWeek(d: Date | string): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function endOfWeek(d: Date | string): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export function addDays(d: Date | string, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addWeeks(d: Date | string, n: number): Date {
  return addDays(d, n * 7);
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function inRange(date: Date | string, start: Date, end: Date): boolean {
  const t = new Date(date).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatWeekRangeLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`;
  const endStr = sameMonth ? `${end.getDate()}` : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
  const yearStr = sameYear ? "" : `, ${end.getFullYear()}`;
  return `${startStr} \u2013 ${endStr}${yearStr}`;
}

export function formatDayLabel(date: Date | string): string {
  const today = new Date();
  const yesterday = addDays(today, -1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  const d = new Date(date);
  return `${DAYS_SHORT[(d.getDay() + 6) % 7]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up? \ud83c\udf19";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [catId, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return catId;
  }
  return null;
}

export interface ParsedExpense {
  amount: number | null;
  description: string;
  categoryId: string | null;
  date: Date;
  missing: { amount: boolean; description: boolean };
}

// Parses free text like "₹120 lunch", "Spent 250 on dinner", "500 shopping yesterday"
export function parseQuickPrompt(text: string, categories: Category[]): ParsedExpense {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  let dateResult = new Date();
  let workingText = raw;

  if (/\byesterday\b/i.test(lower)) {
    dateResult = addDays(new Date(), -1);
    workingText = workingText.replace(/\byesterday\b/i, "");
  } else if (/\btoday\b/i.test(lower)) {
    workingText = workingText.replace(/\btoday\b/i, "");
  } else {
    const weekdayNames = DAYS_SHORT.concat(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    const weekdayMatch = weekdayNames.find((d) => new RegExp(`\\b${d}\\b`, "i").test(lower));
    if (weekdayMatch) {
      workingText = workingText.replace(new RegExp(`\\b${weekdayMatch}\\b`, "i"), "");
    }
  }

  const amountMatch = workingText.match(/(?:rs\.?|inr|\u20b9)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : null;
  if (amountMatch && amountMatch.index !== undefined) {
    workingText = workingText.slice(0, amountMatch.index) + workingText.slice(amountMatch.index + amountMatch[0].length);
  }

  const catId = detectCategory(raw);

  let description = workingText
    .replace(/\u20b9|rs\.?|inr/gi, "")
    .replace(/\bspent\b/gi, "")
    .replace(/\bon\b/gi, "")
    .replace(/\bfor\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!description && catId) {
    description = categories.find((c) => c.id === catId)?.label || "";
  }
  if (description) {
    description = description[0].toUpperCase() + description.slice(1);
  }

  return {
    amount,
    description: description || "",
    categoryId: catId,
    date: dateResult,
    missing: {
      amount: amount === null,
      description: !description,
    },
  };
}
