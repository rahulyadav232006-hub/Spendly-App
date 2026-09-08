export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // stored as a plain decimal number; sums use integer-cent math (see lib/utils.ts)
  description: string;
  category: string; // category id for expenses, income-source id for income
  source?: string; // only for income
  dateTime: string; // ISO string
  note: string;
  createdAt: string; // ISO string
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  custom?: boolean;
}

export interface IncomeSource {
  id: string;
  label: string;
  emoji: string;
}

export interface RegularExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
}

export interface ReminderSettings {
  enabled: boolean;
  lastFiredDate?: string;
  time: string; // "HH:MM"
  frequency: "daily" | "weekdays" | "weekly";
}

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  onboarded: boolean;
  weeklyBudget: number;
  currency: string;
  categories: Category[];
  reminder: ReminderSettings;
  theme: ThemeMode;
}

export interface SpendlyState {
  settings: Settings;
  transactions: Transaction[];
  regularExpenses: RegularExpense[];
}
