"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SpendlyState, Transaction } from "@/types";
import { endOfWeek, inRange, startOfWeek } from "@/lib/utils";
import { CatMark, inputCls } from "./ui";
import { TxnRow } from "./TxnRow";

export function Transactions({
  state,
  onEditTxn,
  onDeleteTxn,
}: {
  state: SpendlyState;
  onEditTxn: (t: Transaction) => void;
  onDeleteTxn: (t: Transaction) => void;
}) {
  const { settings, transactions } = state;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month">("all");

  const catById = Object.fromEntries(settings.categories.map((c) => [c.id, c]));

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === "all" ? true : t.category === categoryFilter))
      .filter((t) => (search ? t.description.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((t) => {
        if (dateFilter === "all") return true;
        const d = new Date(t.dateTime);
        if (dateFilter === "week") return inRange(d, startOfWeek(now), endOfWeek(now));
        if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [transactions, search, categoryFilter, typeFilter, dateFilter]);

  return (
    <div className="pb-24 sm:pb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 mb-1 font-display">Transactions</h1>
      <p className="text-sm text-slate-500 dark:text-stone-400 mb-5">
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions" className={`${inputCls} pl-10`} />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 shrink-0">
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 shrink-0">
          <option value="all">All categories</option>
          {settings.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)} className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-50 shrink-0">
          <option value="all">All time</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-slate-200 dark:border-stone-800">
          <CatMark className="w-14 h-14 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-stone-50">No transactions found</p>
          <p className="text-xs text-slate-400 dark:text-stone-500 mt-1">Try changing your filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 px-4 divide-y divide-slate-50 dark:divide-stone-800">
          {filtered.map((t) => (
            <TxnRow key={t.id} txn={t} category={catById[t.category]} currency={settings.currency} onEdit={onEditTxn} onDelete={onDeleteTxn} />
          ))}
        </div>
      )}
    </div>
  );
}
