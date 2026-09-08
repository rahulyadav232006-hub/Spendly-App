import { Category, Transaction } from "@/types";
import { DAYS_SHORT, addDays, endOfWeek, fromCents, inRange, isSameDay, sumCents, toCents } from "./utils";

/** All transactions whose dateTime falls within [weekStart, endOfWeek(weekStart)]. */
export function getWeekTransactions(transactions: Transaction[], weekStart: Date): Transaction[] {
  const weekEnd = endOfWeek(weekStart);
  return transactions.filter((t) => inRange(t.dateTime, weekStart, weekEnd));
}

/** All transactions strictly before the given week starts. */
export function getPriorTransactions(transactions: Transaction[], weekStart: Date): Transaction[] {
  const startMs = weekStart.getTime();
  return transactions.filter((t) => new Date(t.dateTime).getTime() < startMs);
}

function sumByType(txns: Transaction[], type: "income" | "expense"): number {
  return fromCents(sumCents(txns.filter((t) => t.type === type).map((t) => t.amount)));
}

/**
 * Net leftover (all income minus all expenses) from every transaction
 * before this week — i.e. the running balance carried in from the past.
 * This is what makes an unused balance persist into the next week instead
 * of resetting to 0: it's not a stored/duplicated value, it's derived
 * fresh each time directly from transaction history, so it can never drift
 * out of sync and switching weeks back and forth can't duplicate it.
 */
export function getCarryForward(transactions: Transaction[], weekStart: Date): number {
  const prior = getPriorTransactions(transactions, weekStart);
  return sumByType(prior, "income") - sumByType(prior, "expense");
}

export interface WeekStats {
  weekTxns: Transaction[];
  weekExpenses: Transaction[];
  added: number;
  spent: number;
  /** Unused balance rolled in from every prior week. */
  carryForward: number;
  /** What this week actually has to spend: carry-forward + this week's added money. */
  available: number;
  /** available - spent. Never reset to 0 just because a new week started. */
  remaining: number;
}

export function computeWeekStats(transactions: Transaction[], weekStart: Date): WeekStats {
  const weekTxns = getWeekTransactions(transactions, weekStart);
  const weekExpenses = weekTxns.filter((t) => t.type === "expense");
  const added = sumByType(weekTxns, "income");
  const spent = sumByType(weekTxns, "expense");
  const carryForward = getCarryForward(transactions, weekStart);
  const available = carryForward + added;
  const remaining = available - spent;
  return { weekTxns, weekExpenses, added, spent, carryForward, available, remaining };
}

export interface CategoryTotal {
  id: string;
  label: string;
  emoji: string;
  color: string;
  value: number;
}

/** Category breakdown for an already week-filtered list of expenses. */
export function getCategoryTotals(weekExpenses: Transaction[], categories: Category[]): CategoryTotal[] {
  const map: Record<string, number> = {};
  for (const t of weekExpenses) {
    // Accumulate in integer cents (toCents), not raw rupee amounts — summing
    // raw amounts and then running the total through fromCents (÷100) at
    // the end silently divided every category total by 100 (₹500 shown as
    // ₹5). Each amount must be converted to cents *before* accumulating.
    map[t.category] = (map[t.category] || 0) + toCents(t.amount);
  }
  return Object.entries(map)
    .map(([id, cents]) => {
      const cat = categories.find((c) => c.id === id) || { label: id, color: "#94a3b8", emoji: "✨" };
      return { id, label: cat.label, emoji: cat.emoji, color: cat.color, value: fromCents(cents) };
    })
    .sort((a, b) => b.value - a.value);
}

/** Per-day expense totals (Mon..Sun) for an already week-filtered list of expenses. */
export function getDailyTotals(weekExpenses: Transaction[], weekStart: Date): { day: string; amount: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const total = fromCents(sumCents(weekExpenses.filter((t) => isSameDay(t.dateTime, day)).map((t) => t.amount)));
    return { day: DAYS_SHORT[i], amount: total };
  });
}
