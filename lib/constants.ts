import { Category, IncomeSource } from "@/types";

export const CATEGORIES: Category[] = [
  { id: "food", label: "Food", emoji: "🍔", color: "#d97706" },
  { id: "travel", label: "Travel", emoji: "🚌", color: "#0891b2" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "#c026d3" },
  { id: "education", label: "Education", emoji: "📚", color: "#4338ca" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", color: "#db2777" },
  { id: "bills", label: "Bills", emoji: "🧾", color: "#b91c1c" },
  { id: "health", label: "Health", emoji: "💊", color: "#059669" },
  { id: "other", label: "Other", emoji: "✨", color: "#57534e" },
];

export const INCOME_SOURCES: IncomeSource[] = [
  { id: "pocket_money", label: "Pocket Money", emoji: "👛" },
  { id: "salary", label: "Salary", emoji: "💼" },
  { id: "parents", label: "Parents", emoji: "🏠" },
  { id: "refund", label: "Refund", emoji: "↩️" },
  { id: "other", label: "Other", emoji: "✨" },
];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["lunch", "dinner", "breakfast", "food", "snack", "coffee", "tea", "restaurant", "meal", "pizza", "burger", "swiggy", "zomato", "chai"],
  travel: ["bus", "auto", "taxi", "uber", "ola", "train", "metro", "fuel", "petrol", "diesel", "cab", "rickshaw", "ticket"],
  shopping: ["shopping", "clothes", "shoes", "amazon", "flipkart", "myntra", "dress", "shirt"],
  education: ["book", "books", "stationery", "course", "fees", "tuition", "notebook", "pen"],
  entertainment: ["movie", "netflix", "game", "party", "concert", "spotify", "outing"],
  bills: ["recharge", "bill", "electricity", "wifi", "rent", "subscription", "internet", "mobile"],
  health: ["medicine", "doctor", "hospital", "pharmacy", "gym", "meds"],
};

export interface CurrencyMeta {
  code: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: "INR", symbol: "₹", locale: "en-IN" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
];

export function getCurrencyMeta(code: string): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
