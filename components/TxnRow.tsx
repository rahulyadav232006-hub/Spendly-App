"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Category, Transaction } from "@/types";
import { INCOME_SOURCES } from "@/lib/constants";
import { formatMoney, formatTime } from "@/lib/utils";
import { IconBubble } from "./ui";

export function TxnRow({
  txn,
  category,
  currency,
  onEdit,
  onDelete,
}: {
  txn: Transaction;
  category?: Category;
  currency: string;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  const isIncome = txn.type === "income";
  const src = isIncome ? INCOME_SOURCES.find((s) => s.id === txn.source) : null;
  return (
    <div className="flex items-center gap-3 py-3 group">
      <IconBubble emoji={isIncome ? src?.emoji || "💰" : category?.emoji || "✨"} tone={isIncome ? "#0f766e" : category?.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-stone-50 truncate">{txn.description}</p>
        <p className="text-xs text-slate-400 dark:text-stone-500">
          {isIncome ? src?.label : category?.label} · {formatTime(txn.dateTime)}
        </p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${isIncome ? "text-teal-700" : "text-slate-900 dark:text-stone-50"}`}>
        {isIncome ? "+" : "-"}
        {formatMoney(txn.amount, currency)}
      </span>
      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(txn)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800" aria-label="Edit">
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button onClick={() => onDelete(txn)} className="p-1.5 rounded-lg hover:bg-rose-50" aria-label="Delete">
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        </button>
      </div>
    </div>
  );
}
