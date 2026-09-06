import { RegularExpense, Settings, SpendlyState, Transaction } from "@/types";
import { CATEGORIES } from "./constants";
import { addDays, uid } from "./utils";

export function defaultSettings(): Settings {
  return {
    onboarded: false,
    weeklyBudget: 4000,
    currency: "INR",
    categories: CATEGORIES,
    reminder: { enabled: false, time: "20:00", frequency: "daily" },
    theme: "system",
  };
}

export function buildSampleTransactions(): Transaction[] {
  const now = new Date();
  const mk = (
    daysAgo: number,
    hour: number,
    type: Transaction["type"],
    amount: number,
    description: string,
    category: string,
    extra: Partial<Transaction> = {}
  ): Transaction => {
    const d = addDays(now, -daysAgo);
    d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
    return {
      id: uid(),
      type,
      amount,
      description,
      category,
      dateTime: d.toISOString(),
      note: "",
      createdAt: d.toISOString(),
      ...extra,
    };
  };
  return [
    mk(0, 9, "income", 4000, "Weekly pocket money", "pocket_money", { source: "pocket_money" }),
    mk(0, 13, "expense", 120, "Lunch", "food"),
    mk(0, 18, "expense", 40, "Bus", "travel"),
    mk(1, 9, "expense", 80, "Coffee", "food"),
    mk(1, 17, "expense", 150, "Stationery", "education"),
    mk(2, 20, "expense", 300, "Movie night", "entertainment"),
    mk(3, 8, "expense", 40, "Bus", "travel"),
    mk(4, 13, "expense", 120, "Lunch", "food"),
    mk(5, 19, "expense", 299, "Mobile recharge", "bills"),
  ];
}

export function defaultRegularExpenses(): RegularExpense[] {
  return [
    { id: uid(), name: "College Bus", amount: 40, category: "travel" },
    { id: uid(), name: "Lunch", amount: 120, category: "food" },
    { id: uid(), name: "Mobile Recharge", amount: 299, category: "bills" },
    { id: uid(), name: "Subscription", amount: 199, category: "entertainment" },
  ];
}

export function defaultState(withSampleData: boolean): SpendlyState {
  return {
    settings: defaultSettings(),
    transactions: withSampleData ? buildSampleTransactions() : [],
    regularExpenses: withSampleData ? defaultRegularExpenses() : [],
  };
}
