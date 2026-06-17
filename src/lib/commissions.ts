import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO,
  startOfWeek, endOfWeek, isSameDay, addMonths, subMonths,
  differenceInCalendarWeeks, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type Commission = {
  id: string;
  date: string; // ISO yyyy-MM-dd
  value: number;
  note?: string;
  category?: string;
  client?: string;
  createdAt: string;
  updatedAt: string;
};

import { getSession } from "@/lib/auth";

function userKey(): string | null {
  const u = getSession();
  return u ? `commission-pro:u:${u}:v1` : null;
}

export function loadAll(): Commission[] {
  if (typeof window === "undefined") return [];
  const key = userKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Commission[]) : [];
  } catch {
    return [];
  }
}

export function saveAll(list: Commission[]) {
  const key = userKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("commissions:changed"));
}

export function upsert(item: Omit<Commission, "createdAt" | "updatedAt" | "id"> & { id?: string }) {
  const now = new Date().toISOString();
  const list = loadAll();
  if (item.id) {
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item, id: item.id, updatedAt: now };
    }
  } else {
    list.push({ ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
  }
  saveAll(list);
}

export function remove(id: string) {
  saveAll(loadAll().filter((x) => x.id !== id));
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
    (acc, cur) => (!acc || cur[1] > acc[1] ? cur : acc),
    null,
  );
  const worst = days.reduce<[string, number] | null>(
    (acc, cur) => (!acc || cur[1] < acc[1] ? cur : acc),
    null,
  );
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
      label: `Semana ${i + 1}`,
      start: clampedStart,
      end: clampedEnd,
      total: items.reduce((s, c) => s + c.value, 0),
      count: items.length,
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
