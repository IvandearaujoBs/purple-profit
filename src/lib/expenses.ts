import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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

function mapRow(r: any): Expense {
  return {
    id: r.id,
    date: r.date,
    value: Number(r.value),
    name: r.name,
    note: r.note ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function loadAllExpenses(): Expense[] {
  return cache;
}

export async function fetchAllExpenses(): Promise<Expense[]> {
  const email = getSession();
  if (!email) { cache = []; cacheUser = null; emit(); return cache; }
  if (cacheUser !== email) cache = [];
  cacheUser = email;
  await migrateLegacyIfNeeded();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });
  if (error) { console.error(error); return cache; }
  cache = (data ?? []).map(mapRow);
  emit();
  return cache;
}

export async function upsertExpense(
  item: Omit<Expense, "createdAt" | "updatedAt" | "id"> & { id?: string },
) {
  const uid = await getUserId();
  if (!uid) throw new Error("Não autenticado");
  if (item.id) {
    const { data, error } = await supabase
      .from("expenses")
      .update({ date: item.date, value: item.value, name: item.name, note: item.note ?? null })
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    cache = cache.map((c) => (c.id === item.id ? mapRow(data) : c));
  } else {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ user_id: uid, date: item.date, value: item.value, name: item.name, note: item.note ?? null })
      .select()
      .single();
    if (error) throw error;
    cache = [mapRow(data), ...cache];
  }
  emit();
}

export async function removeExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  cache = cache.filter((c) => c.id !== id);
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
  const toInsert: any[] = [];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const items: Expense[] = JSON.parse(raw);
      for (const it of items) {
        const sig = `${it.date}|${it.value}|${it.name}|${it.note ?? ""}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        toInsert.push({ user_id: uid, date: it.date, value: it.value, name: it.name, note: it.note ?? null });
      }
    } catch { /* ignore */ }
  }
  if (toInsert.length) {
    const { error } = await supabase.from("expenses").insert(toInsert);
    if (error) { console.error("Migração consumos:", error); return; }
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
