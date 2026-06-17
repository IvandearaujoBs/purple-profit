import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

export type Expense = {
  id: string;
  date: string; // yyyy-MM-dd
  value: number;
  name: string; // produto ou estabelecimento
  note?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = "commission-pro:expenses:v1";

export function loadAllExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function saveAllExpenses(list: Expense[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("expenses:changed"));
}

export function upsertExpense(
  item: Omit<Expense, "createdAt" | "updatedAt" | "id"> & { id?: string },
) {
  const now = new Date().toISOString();
  const list = loadAllExpenses();
  if (item.id) {
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...item, id: item.id, updatedAt: now };
  } else {
    list.push({ ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
  }
  saveAllExpenses(list);
}

export function removeExpense(id: string) {
  saveAllExpenses(loadAllExpenses().filter((x) => x.id !== id));
}

export function expensesInMonth(list: Expense[], ref: Date) {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return list.filter((e) => isWithinInterval(parseISO(e.date), { start, end }));
}

export function expensesMonthTotal(list: Expense[], ref: Date) {
  return expensesInMonth(list, ref).reduce((s, e) => s + e.value, 0);
}
