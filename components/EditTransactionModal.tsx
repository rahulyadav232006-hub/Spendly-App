"use client";

import React, { useEffect, useState } from "react";
import { Category, Transaction } from "@/types";
import { getCurrencyMeta } from "@/lib/constants";
import { Field, Sheet, inputCls } from "./ui";

export function EditTransactionModal({
  txn,
  onClose,
  onSave,
  categories,
  currency,
}: {
  txn: Transaction | null;
  onClose: () => void;
  onSave: (t: Transaction) => void;
  categories: Category[];
  currency: string;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("other");
  const [dateTime, setDateTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (txn) {
      setAmount(String(txn.amount));
      setDescription(txn.description);
      setCategoryId(txn.category);
      const d = new Date(txn.dateTime);
      const pad = (n: number) => String(n).padStart(2, "0");
      setDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setNote(txn.note || "");
      setError("");
    }
  }, [txn]);

  if (!txn) return null;
  const isIncome = txn.type === "income";

  function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    onSave({ ...(txn as Transaction), amount: amt, description: description.trim() || (txn as Transaction).description, category: categoryId, dateTime: new Date(dateTime).toISOString(), note });
  }

  return (
    <Sheet open={!!txn} onClose={onClose} title={isIncome ? "Edit income" : "Edit expense"}>
      <Field label="Amount" hint={error}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getCurrencyMeta(currency).symbol}</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} pl-7`} />
        </div>
      </Field>
      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </Field>
      {!isIncome && (
        <Field label="Category">
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium ${
                  categoryId === c.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
                }`}
              >
                <span className="text-lg">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Date & time">
        <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Note">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>
      <button onClick={submit} className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm mt-1">
        Save Changes
      </button>
    </Sheet>
  );
}
