"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Transaction, RegularExpense } from "@/types";
import { INCOME_SOURCES } from "@/lib/constants";
import { startOfWeek } from "@/lib/utils";
import { useSpendlyStore } from "@/hooks/useSpendlyStore";
import { ConfirmDialog, Toast, ToastState } from "./ui";
import { Onboarding } from "./Onboarding";
import { Sidebar, BottomNav, PageId } from "./Nav";
import { Dashboard } from "./Dashboard";
import { Insights } from "./Insights";
import { Transactions } from "./Transactions";
import { RegularExpenses } from "./RegularExpenses";
import { SettingsPage } from "./SettingsPage";
import { AddExpenseModal } from "./AddExpenseModal";
import { AddMoneyModal } from "./AddMoneyModal";
import { EditTransactionModal } from "./EditTransactionModal";

export default function SpendlyApp() {
  const {
    state,
    loading,
    error,
    dismissError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateSettings,
    createRegularExpense,
    updateRegularExpense,
    deleteRegularExpense,
    completeOnboarding,
    importData,
    deleteAllData,
  } = useSpendlyStore();

  const [page, setPage] = useState<PageId>("dashboard");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (error) notify(error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Apply theme (light / dark / system) to <html>.
  useEffect(() => {
    if (!state) return;
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle("dark", dark);
    if (state.settings.theme === "dark") {
      apply(true);
      return;
    }
    if (state.settings.theme === "light") {
      apply(false);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, [state?.settings.theme]);

  if (loading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
          <p className="text-sm text-slate-400 dark:text-stone-500">Loading Spendly…</p>
        </div>
      </div>
    );
  }

  if (!state.settings.onboarded) {
    return (
      <Onboarding
        onFinish={({ weeklyBudget, initialAmount, source }) => {
          const initialTxn =
            initialAmount > 0
              ? {
                  type: "income" as const,
                  amount: initialAmount,
                  description: INCOME_SOURCES.find((s) => s.id === source)?.label || "Starting balance",
                  category: source,
                  source,
                  dateTime: new Date().toISOString(),
                  note: "Added during onboarding",
                }
              : null;
          completeOnboarding(weeklyBudget, initialTxn);
        }}
      />
    );
  }

  function quickAddRegular(r: RegularExpense) {
    addTransaction({ type: "expense", amount: r.amount, description: r.name, category: r.category, dateTime: new Date().toISOString(), note: "Quick add" });
    notify(`${r.name} added ✓`);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spendly-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Data exported ✓");
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.transactions || !parsed.settings) throw new Error("bad shape");
        importData({ ...parsed, settings: { ...parsed.settings, onboarded: true } })
          .then(() => notify("Data imported ✓"))
          .catch(() => notify("Couldn't import that file.", "error"));
      } catch {
        notify("That file doesn't look like a Spendly export", "error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-stone-950">
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 min-w-0">
        <main className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {page === "dashboard" && (
            <Dashboard
              state={state}
              weekStart={weekStart}
              setWeekStart={setWeekStart}
              onOpenAddMoney={() => setAddMoneyOpen(true)}
              onEditTxn={setEditingTxn}
              onDeleteTxn={setDeletingTxn}
              onQuickAddRegular={quickAddRegular}
            />
          )}
          {page === "insights" && <Insights state={state} weekStart={weekStart} />}
          {page === "transactions" && <Transactions state={state} onEditTxn={setEditingTxn} onDeleteTxn={setDeletingTxn} />}
          {page === "regular" && (
            <RegularExpenses state={state} onCreate={createRegularExpense} onUpdate={updateRegularExpense} onDelete={deleteRegularExpense} onQuickAdd={quickAddRegular} />
          )}
          {page === "settings" && (
            <SettingsPage state={state} onUpdateSettings={updateSettings} onExport={exportData} onImport={handleImport} onDeleteAll={deleteAllData} notify={notify} />
          )}
        </main>
      </div>

      <BottomNav page={page} setPage={setPage} onAdd={() => setAddExpenseOpen(true)} />

      <button
        onClick={() => setAddExpenseOpen(true)}
        className="hidden sm:flex fixed bottom-8 right-8 items-center gap-2 px-5 py-3.5 rounded-full bg-teal-700 hover:bg-teal-800 text-white font-medium shadow-xl z-30"
      >
        <Plus className="w-4 h-4" /> Add Expense
      </button>

      <AddExpenseModal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} onSave={addTransaction} categories={state.settings.categories} currency={state.settings.currency} notify={notify} />
      <AddMoneyModal open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} onSave={addTransaction} currency={state.settings.currency} notify={notify} />
      <EditTransactionModal
        txn={editingTxn}
        onClose={() => setEditingTxn(null)}
        onSave={(t) => {
          updateTransaction(t);
          setEditingTxn(null);
          notify("Changes saved ✓");
        }}
        categories={state.settings.categories}
        currency={state.settings.currency}
      />
      <ConfirmDialog
        open={!!deletingTxn}
        title="Delete this transaction?"
        message={`"${deletingTxn?.description}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeletingTxn(null)}
        onConfirm={() => {
          if (deletingTxn) {
            deleteTransaction(deletingTxn.id);
            notify("Transaction deleted");
          }
          setDeletingTxn(null);
        }}
      />
      <Toast toast={toast} />
    </div>
  );
}
