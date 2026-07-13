import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO,
  startOfWeek, endOfWeek, isSameDay, addMonths, subMonths,
  differenceInCalendarWeeks, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSession, getUserId } from "@/lib/auth";

export type Commission = {
  id: string;
  date: string; // ISO yyyy-MM-dd
  value: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

let cache: Commission[] = [];
let cacheUser: string | null = null;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("commissions:changed"));
  }
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getStorageKey(email: string | null) {
  return email ? `commission-pro:data:${email}:commissions` : null;
}

function readItems(email: string | null): Commission[] {
  const storage = getStorage();
  const key = getStorageKey(email);
  if (!storage || !key) return [];
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Commission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(email: string | null, items: Commission[]) {
  const storage = getStorage();
  const key = getStorageKey(email);
  if (!storage || !key) return;
  storage.setItem(key, JSON.stringify(items));
}

function mapRow(r: any): Commission {
  return {
    id: r.id,
    date: r.date,
    value: Number(r.value),
    note: r.note ?? undefined,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? r.updatedAt ?? new Date().toISOString(),
  };
}

export function loadAll(): Commission[] {
  return cache;
}

export async function fetchAll(): Promise<Commission[]> {
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

export async function upsert(
  item: Omit<Commission, "createdAt" | "updatedAt" | "id"> & { id?: string },
) {
  const uid = await getUserId();
  if (!uid) throw new Error("Não autenticado");
  const now = new Date().toISOString();
  if (item.id) {
    const existing = cache.find((c) => c.id === item.id);
    const updated: Commission = {
      id: item.id,
      date: item.date,
      value: item.value,
      note: item.note ?? undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    cache = cache.map((c) => (c.id === item.id ? updated : c));
  } else {
    const created: Commission = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: item.date,
      value: item.value,
      note: item.note ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    cache = [created, ...cache];
  }
  writeItems(uid, cache);
  emit();
}

export async function remove(id: string) {
  cache = cache.filter((c) => c.id !== id);
  const uid = await getUserId();
  if (uid) writeItems(uid, cache);
  emit();
}

async function migrateLegacyIfNeeded() {
  if (typeof window === "undefined") return;
  const email = getSession();
  if (!email) return;
  const flag = `commission-pro:migrated:${email}:commissions`;
  if (localStorage.getItem(flag)) return;
  const uid = await getUserId();
  if (!uid) return;
  const keys = [`commission-pro:u:${email}:v1`, "commission-pro:v1"];
  const seen = new Set<string>();
  const toInsert: Commission[] = [];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const items: Commission[] = JSON.parse(raw);
      for (const it of items) {
        const sig = `${it.date}|${it.value}|${it.note ?? ""}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        toInsert.push(mapRow({
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          date: it.date,
          value: it.value,
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

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (d: Date | string, p = "dd/MM/yyyy") =>
  format(typeof d === "string" ? parseISO(d) : d, p, { locale: ptBR });

export const fmtMonth = (d: Date) =>
  format(d, "MMMM yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase());

export function monthRange(ref: Date) {
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
}

export function inMonth(list: Commission[], ref: Date) {
  const { start, end } = monthRange(ref);
  return list.filter((c) => {
    const d = parseISO(c.date);
    return isWithinInterval(d, { start, end });
  });
}

export function monthStats(list: Commission[], ref: Date) {
  const items = inMonth(list, ref);
  const total = items.reduce((s, c) => s + c.value, 0);
  const byDay = new Map<string, number>();
  items.forEach((c) => byDay.set(c.date, (byDay.get(c.date) ?? 0) + c.value));
  const days = Array.from(byDay.entries());
  const best = days.reduce<[string, number] | null>(
    (acc, cur) => (!acc || cur[1] > acc[1] ? cur : acc), null);
  const worst = days.reduce<[string, number] | null>(
    (acc, cur) => (!acc || cur[1] < acc[1] ? cur : acc), null);
  const { start, end } = monthRange(ref);
  const daysInMonth = eachDayOfInterval({ start, end }).length;
  const avg = total / daysInMonth;
  return { items, total, avg, best, worst, count: items.length, byDay };
}

export function weeklyBreakdown(list: Commission[], ref: Date) {
  const { start, end } = monthRange(ref);
  const weeks: { label: string; start: Date; end: Date; total: number; count: number }[] = [];
  const totalWeeks = differenceInCalendarWeeks(end, start, { weekStartsOn: 1 }) + 1;
  for (let i = 0; i < totalWeeks; i++) {
    const wStart = i === 0 ? start : startOfWeek(new Date(start.getFullYear(), start.getMonth(), 1 + i * 7), { weekStartsOn: 1 });
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
    const clampedStart = wStart < start ? start : wStart;
    const clampedEnd = wEnd > end ? end : wEnd;
    if (clampedStart > end) break;
    const items = list.filter((c) => {
      const d = parseISO(c.date);
      return isWithinInterval(d, { start: clampedStart, end: clampedEnd });
    });
    weeks.push({
      label: `Semana ${i + 1}`, start: clampedStart, end: clampedEnd,
      total: items.reduce((s, c) => s + c.value, 0), count: items.length,
    });
  }
  return weeks;
}

export function dailySeries(list: Commission[], ref: Date) {
  const { start, end } = monthRange(ref);
  const days = eachDayOfInterval({ start, end });
  const stats = monthStats(list, ref);
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const value = stats.byDay.get(key) ?? 0;
    return { day: format(d, "dd"), date: key, value };
  });
}

export function cumulativeSeries(list: Commission[], ref: Date) {
  const series = dailySeries(list, ref);
  let acc = 0;
  return series.map((p) => ({ ...p, acumulado: (acc += p.value) }));
}

export function prevMonthDelta(list: Commission[], ref: Date) {
  const cur = monthStats(list, ref).total;
  const prev = monthStats(list, subMonths(ref, 1)).total;
  if (prev === 0) return cur === 0 ? 0 : 100;
  return ((cur - prev) / prev) * 100;
}

export const navMonth = { add: addMonths, sub: subMonths, isSameDay };
