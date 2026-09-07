"use client";

import React, { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { RegularExpense, SpendlyState, Transaction } from "@/types";
import {
  addWeeks,
  endOfWeek,
  formatMoney,
  formatDayLabel,
  formatWeekRangeLabel,
  fromCents,
  greetingForNow,
  inRange,
  isSameDay,
  startOfDay,
  startOfWeek,
  sumCents,
} from "@/lib/utils";
import { BudgetRing } from "./ui";
import { CatMascot } from "./CatMascot";
import { TxnRow } from "./TxnRow";

export function Dashboard({
  state,
  weekStart,
  setWeekStart,
  onOpenAddMoney,
  onEditTxn,
  onDeleteTxn,
  onQuickAddRegular,
}: {
  state: SpendlyState;
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  onOpenAddMoney: () => void;
  onEditTxn: (t: Transaction) => void;
  onDeleteTxn: (t: Transaction) => void;
  onQuickAddRegular: (r: RegularExpense) => void;
}) {
  const { settings, transactions, regularExpenses } = state;
  const weekEnd = endOfWeek(weekStart);
  const weekTxns = useMemo(() => transactions.filter((t) => inRange(t.dateTime, weekStart, weekEnd)), [transactions, weekStart, weekEnd]);
  const added = fromCents(sumCents(weekTxns.filter((t) => t.type === "income").map((t) => t.amount)));
  const spent = fromCents(sumCents(weekTxns.filter((t) => t.type === "expense").map((t) => t.amount)));
  const remaining = added - spent;
  const budget = settings.weeklyBudget;
  const budgetPercent = budget > 0 ? (spent / budget) * 100 : 0;
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date()));

  const expenseTxns = weekTxns.filter((t) => t.type === "expense").sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of expenseTxns) {
      const key = startOfDay(t.dateTime).toISOString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseTxns]);

  const catById = Object.fromEntries(settings.categories.map((c) => [c.id, c]));

  return (
    <div className="pb-24 sm:pb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 font-display">{greetingForNow()} 👋</h1>
          <p className="text-sm text-slate-500 dark:text-stone-400 mt-0.5">Here&apos;s where your week stands.</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white dark:bg-stone-900 rounded-2xl px-3 py-2.5 border border-slate-100 dark:border-stone-800">
        <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800" aria-label="Previous week">
          <ChevronLeft className="w-4 h-4 text-slate-900 dark:text-stone-50" />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">{isCurrentWeek ? "This Week" : "Week"}</p>
          <p className="text-sm font-medium text-slate-900 dark:text-stone-50">{formatWeekRangeLabel(weekStart, weekEnd)}</p>
        </div>
        <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800" aria-label="Next week">
          <ChevronRight className="w-4 h-4 text-slate-900 dark:text-stone-50" />
        </button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 text-white p-6 mb-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm mb-1">Remaining</p>
            <p className="text-4xl font-bold tabular-nums font-display">{formatMoney(remaining, settings.currency)}</p>
            {remaining < 0 && <p className="text-rose-200 text-xs mt-1.5 font-medium">You&apos;ve gone over — that&apos;s okay, just keep an eye on it.</p>}
          </div>
          <div className="relative shrink-0">
            <BudgetRing percent={budgetPercent} size={92} />
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xs font-bold">{Math.round(budgetPercent)}%</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-teal-100 text-xs mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Added
            </div>
            <p className="font-semibold">{formatMoney(added, settings.currency)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-teal-100 text-xs mb-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Spent
            </div>
            <p className="font-semibold">{formatMoney(spent, settings.currency)}</p>
          </div>
        </div>
      </div>

      {budget > 0 && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 dark:text-stone-500">Weekly Budget</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-stone-50">{formatMoney(budget, settings.currency)}</p>
          </div>
          <p
            className={`text-xs font-medium px-2.5 py-1 rounded-full text-right ${
              spent > budget ? "bg-rose-50 text-rose-600" : budgetPercent > 80 ? "bg-amber-50 text-amber-600" : "bg-teal-50 dark:bg-teal-950 text-teal-700"
            }`}
          >
            {spent > budget ? `${formatMoney(spent - budget, settings.currency)} over weekly budget` : budgetPercent > 80 ? "You're close to your weekly budget" : "On track"}
          </p>
        </div>
      )}

      {regularExpenses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-900 dark:text-stone-50 mb-2.5">Quick add</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {regularExpenses.map((r) => {
              const cat = catById[r.category];
              return (
                <button
                  key={r.id}
                  onClick={() => onQuickAddRegular(r)}
                  className="shrink-0 flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 hover:border-teal-300 text-sm"
                >
                  <span>{cat?.emoji}</span>
                  <span className="font-medium text-slate-900 dark:text-stone-50">{r.name}</span>
                  <span className="text-slate-400 dark:text-stone-500">{formatMoney(r.amount, settings.currency)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-stone-50">This Week&apos;s Expenses</p>
          <button onClick={onOpenAddMoney} className="text-xs font-medium text-teal-700 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> Add money
          </button>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-14 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-slate-200 dark:border-stone-800">
            <CatMascot size={64} className="mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-stone-50">No expenses yet this week</p>
            <p className="text-xs text-slate-400 dark:text-stone-500 mt-1">Add your first one — it only takes a few seconds.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 px-4 divide-y divide-slate-100 dark:divide-stone-800">
            {grouped.map(([dayKey, txns]) => (
              <div key={dayKey} className="py-2">
                <p className="text-xs font-semibold text-slate-400 dark:text-stone-500 uppercase tracking-wide pt-2 pb-1">{formatDayLabel(dayKey)}</p>
                <div className="divide-y divide-slate-50 dark:divide-stone-800">
                  {txns.map((t) => (
                    <TxnRow key={t.id} txn={t} category={catById[t.category]} currency={settings.currency} onEdit={onEditTxn} onDelete={onDeleteTxn} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
