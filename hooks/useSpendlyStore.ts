"use client";

import { useCallback, useEffect, useState } from "react";
import { RegularExpense, Settings, SpendlyState, Transaction } from "@/types";
import { defaultState } from "@/lib/sampleData";
import { uid } from "@/lib/utils";
import * as db from "@/services/db";

export function useSpendlyStore() {
  const [state, setState] = useState<SpendlyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    db
      .loadState()
      .then((loaded) => {
        if (!cancelled) setState(loaded);
      })
      .catch(() => {
        // IndexedDB unavailable (very old browser / private mode edge cases) — fall back to in-memory only.
        if (!cancelled) {
          setError("Your browser blocked persistent storage, so changes won't be saved after you close this tab.");
          setState(defaultState(true));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addTransaction = useCallback((data: Omit<Transaction, "id" | "createdAt">) => {
    const txn: Transaction = { id: uid(), createdAt: new Date().toISOString(), ...data };
    setState((prev) => (prev ? { ...prev, transactions: [...prev.transactions, txn] } : prev));
    db.saveTransaction(txn).catch(() => setError("Couldn't save that — storage may be full or blocked."));
    return txn;
  }, []);

  const updateTransaction = useCallback((txn: Transaction) => {
    setState((prev) => (prev ? { ...prev, transactions: prev.transactions.map((t) => (t.id === txn.id ? txn : t)) } : prev));
    db.saveTransaction(txn).catch(() => setError("Couldn't save your changes."));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, transactions: prev.transactions.filter((t) => t.id !== id) } : prev));
    db.deleteTransactionById(id).catch(() => setError("Couldn't delete that transaction."));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => {
      if (!prev) return prev;
      const nextSettings = { ...prev.settings, ...patch };
      db.saveSettings(nextSettings).catch(() => setError("Couldn't save settings."));
      return { ...prev, settings: nextSettings };
    });
  }, []);

  const createRegularExpense = useCallback((data: RegularExpense) => {
    setState((prev) => (prev ? { ...prev, regularExpenses: [...prev.regularExpenses, data] } : prev));
    db.saveRegularExpense(data).catch(() => setError("Couldn't save that regular expense."));
  }, []);

  const updateRegularExpense = useCallback((data: RegularExpense) => {
    setState((prev) => (prev ? { ...prev, regularExpenses: prev.regularExpenses.map((r) => (r.id === data.id ? data : r)) } : prev));
    db.saveRegularExpense(data).catch(() => setError("Couldn't save your changes."));
  }, []);

  const deleteRegularExpense = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, regularExpenses: prev.regularExpenses.filter((r) => r.id !== id) } : prev));
    db.deleteRegularExpenseById(id).catch(() => setError("Couldn't delete that."));
  }, []);

  const completeOnboarding = useCallback((weeklyBudget: number, initialTxn: Omit<Transaction, "id" | "createdAt"> | null) => {
    setState((prev) => {
      if (!prev) return prev;
      const nextSettings = { ...prev.settings, onboarded: true, weeklyBudget };
      let nextTransactions = prev.transactions;
      if (initialTxn) {
        const txn: Transaction = { id: uid(), createdAt: new Date().toISOString(), ...initialTxn };
        nextTransactions = [...prev.transactions, txn];
        db.saveTransaction(txn).catch(() => {});
      }
      db.saveSettings(nextSettings).catch(() => {});
      return { ...prev, settings: nextSettings, transactions: nextTransactions };
    });
  }, []);

  const importData = useCallback(async (state: SpendlyState) => {
    await db.replaceAll(state);
    setState(state);
  }, []);

  const deleteAllData = useCallback(async () => {
    const fresh = await db.wipeAll();
    setState(fresh);
  }, []);

  return {
    state,
    loading,
    error,
    dismissError: () => setError(null),
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
  };
}
