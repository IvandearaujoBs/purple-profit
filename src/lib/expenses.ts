import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { getSession, getUserId } from "@/lib/auth";

export type Expense = {
  id: string;
  date: string;
  value: number;
  name: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

let cache: Expense[] = [];
let cacheUser: string | null = null;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("expenses:changed"));
  }
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getStorageKey(email: string | null) {
  return email ? `commission-pro:data:${email}:expenses` : null;
}

function readItems(email: string | null): Expense[] {
  const storage = getStorage();
  const key = getStorageKey(email);
  if (!storage || !key) return [];
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Expense[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(email: string | null, items: Expense[]) {
  const storage = getStorage();
  const key = getStorageKey(email);
  if (!storage || !key) return;
  storage.setItem(key, JSON.stringify(items));
}

function mapRow(r: any): Expense {
  return {
    id: r.id,
    date: r.date,
    value: Number(r.value),
    name: r.name,
    note: r.note ?? undefined,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? r.updatedAt ?? new Date().toISOString(),
  };
}

export function loadAllExpenses(): Expense[] {
  return cache;
}

export async function fetchAllExpenses(): Promise<Expense[]> {
  const email = getSession();
  if (!email) {
    cache = [];
    cacheUser = null;
    emit();
    return cache;
  }
  if (cacheUser !== email) cache = readItems(email);
  cacheUser = email;
  await migrateLegacyIfNeeded();
  cache = readItems(email);
  emit();
  return cache;
}

export async function upsertExpense(
  item: Omit<Expense, "createdAt" | "updatedAt" | "id"> & { id?: string },
) {
  const uid = await getUserId();
  if (!uid) throw new Error("Não autenticado");
  const now = new Date().toISOString();
  if (item.id) {
    const existing = cache.find((c) => c.id === item.id);
    const updated: Expense = {
      id: item.id,
      date: item.date,
      value: item.value,
      name: item.name,
      note: item.note ?? undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    cache = cache.map((c) => (c.id === item.id ? updated : c));
  } else {
    const created: Expense = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: item.date,
      value: item.value,
      name: item.name,
      note: item.note ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    cache = [created, ...cache];
  }
  writeItems(uid, cache);
  emit();
}

export async function removeExpense(id: string) {
  cache = cache.filter((c) => c.id !== id);
  const uid = await getUserId();
  if (uid) writeItems(uid, cache);
  emit();
}

async function migrateLegacyIfNeeded() {
  if (typeof window === "undefined") return;
  const email = getSession();
  if (!email) return;
  const flag = `commission-pro:migrated:${email}:expenses`;
  if (localStorage.getItem(flag)) return;
  const uid = await getUserId();
  if (!uid) return;
  const keys = [`commission-pro:u:${email}:expenses:v1`, "commission-pro:expenses:v1"];
  const seen = new Set<string>();
  const toInsert: Expense[] = [];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const items: Expense[] = JSON.parse(raw);
      for (const it of items) {
        const sig = `${it.date}|${it.value}|${it.name}|${it.note ?? ""}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        toInsert.push(mapRow({
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          date: it.date,
          value: it.value,
          name: it.name,
          note: it.note ?? null,
          created_at: it.createdAt ?? new Date().toISOString(),
          updated_at: it.updatedAt ?? new Date().toISOString(),
        }));
      }
    } catch {
      // ignore
    }
  }
  if (toInsert.length) {
    cache = [...toInsert, ...cache.filter((item) => !toInsert.some((candidate) => candidate.id === item.id))];
    writeItems(uid, cache);
  }
  localStorage.setItem(flag, "1");
}

export function expensesInMonth(list: Expense[], ref: Date) {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return list.filter((e) => isWithinInterval(parseISO(e.date), { start, end }));
}

export function expensesMonthTotal(list: Expense[], ref: Date) {
  return expensesInMonth(list, ref).reduce((s, e) => s + e.value, 0);
}
