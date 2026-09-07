"use client";

import React, { useEffect, useState } from "react";
import { Transaction } from "@/types";
import { getCurrencyMeta, INCOME_SOURCES } from "@/lib/constants";
import { Field, Sheet, inputCls } from "./ui";

type AddIncomeData = Omit<Transaction, "id" | "createdAt">;

export function AddMoneyModal({
  open,
  onClose,
  onSave,
  currency,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddIncomeData) => void;
  currency: string;
  notify: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(INCOME_SOURCES[0].id);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setSource(INCOME_SOURCES[0].id);
      setDate(new Date().toISOString().slice(0, 10));
      setNote("");
      setError("");
    }
  }, [open]);

  function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount greater than 0");
      return;
    }
    onSave({
      type: "income",
      amount: amt,
      description: INCOME_SOURCES.find((s) => s.id === source)?.label || "Income",
      category: source,
      source,
      dateTime: new Date(date + "T12:00:00").toISOString(),
      note: note.trim(),
    });
    notify("Money added ✓");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add money">
      <Field label="Amount" hint={error}>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getCurrencyMeta(currency).symbol}</span>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${inputCls} pl-7`} />
        </div>
      </Field>
      <Field label="Source">
        <div className="grid grid-cols-3 gap-2">
          {INCOME_SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium ${
                source === s.id ? "border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700" : "border-slate-200 dark:border-stone-700 text-slate-500 dark:text-stone-400"
              }`}
            >
              <span className="text-lg">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Note (optional)">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className={inputCls} />
      </Field>
      <button onClick={submit} className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm mt-1">
        Add Money
      </button>
    </Sheet>
  );
}
