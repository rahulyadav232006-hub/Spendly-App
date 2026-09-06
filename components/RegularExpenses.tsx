"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Category, RegularExpense, SpendlyState } from "@/types";
import { formatMoney } from "@/lib/utils";
import { CatMark, ConfirmDialog, Field, IconBubble, Sheet, inputCls } from "./ui";

function RegularExpenseForm({
  open,
  onClose,
  onSave,
  initial,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: RegularExpense) => void;
  initial: RegularExpense | null;
  categories: Category[];
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "other");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setAmount(initial ? String(initial.amount) : "");
      setCategoryId(initial?.category || categories[0]?.id || "other");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  function submit() {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) {
      setError("Add a name and an amount greater than 0");
      return;
    }
    onSave({ id: initial?.id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), amount: amt, category: categoryId });
  }

  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit regular expense" : "New regular expense"}>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. College Bus" className={inputCls} />
      </Field>
      <Field label="Amount" hint={error}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
      </Field>
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
      <button onClick={submit} className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm mt-1">
        {initial ? "Save Changes" : "Create"}
      </button>
    </Sheet>
  );
}

export function RegularExpenses({
  state,
  onCreate,
  onUpdate,
  onDelete,
  onQuickAdd,
}: {
  state: SpendlyState;
  onCreate: (r: RegularExpense) => void;
  onUpdate: (r: RegularExpense) => void;
  onDelete: (id: string) => void;
  onQuickAdd: (r: RegularExpense) => void;
}) {
  const { settings, regularExpenses } = state;
  const catById = Object.fromEntries(settings.categories.map((c) => [c.id, c]));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RegularExpense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RegularExpense | null>(null);

  return (
    <div className="pb-24 sm:pb-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-stone-50 font-display">Regular Expenses</h1>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="p-2.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white"
          aria-label="Add regular expense"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-slate-500 dark:text-stone-400 mb-5">Recurring costs you can add in a single tap.</p>

      {regularExpenses.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-slate-200 dark:border-stone-800">
          <CatMark className="w-14 h-14 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-stone-50">No regular expenses yet</p>
          <p className="text-xs text-slate-400 dark:text-stone-500 mt-1">Add things like bus fare or a subscription.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {regularExpenses.map((r) => {
            const cat = catById[r.category];
            return (
              <div key={r.id} className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-2xl border border-slate-100 dark:border-stone-800 px-4 py-3.5">
                <IconBubble emoji={cat?.emoji} tone={cat?.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-stone-50 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 dark:text-stone-500">{cat?.label}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-stone-50">{formatMoney(r.amount, settings.currency)}</span>
                <button onClick={() => onQuickAdd(r)} className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 hover:bg-teal-100" aria-label={`Add ${r.name}`}>
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditing(r);
                    setFormOpen(true);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button onClick={() => setConfirmDelete(r)} className="p-2 rounded-xl hover:bg-rose-50" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <RegularExpenseForm
        open={formOpen}
        initial={editing}
        categories={settings.categories}
        onClose={() => setFormOpen(false)}
        onSave={(data) => {
          if (editing) onUpdate(data);
          else onCreate(data);
          setFormOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this regular expense?"
        message={`"${confirmDelete?.name}" will be removed from your quick-add list.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) onDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
