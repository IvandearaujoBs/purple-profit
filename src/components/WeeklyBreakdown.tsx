import { weeklyBreakdown, fmtBRL, fmtDate, type Commission } from "@/lib/commissions";

export function WeeklyBreakdown({ list, ref }: { list: Commission[]; ref: Date }) {
  const weeks = weeklyBreakdown(list, ref);
  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="mb-3 font-display text-base font-semibold">Comissões por semana</h3>
      <div className="space-y-2">
        {weeks.map((w) => (
          <div key={w.label} className="flex items-center gap-3 rounded-2xl bg-surface-soft/60 px-3 py-2.5 border border-border/40">
            <div className="rounded-lg bg-primary/20 px-2 py-1 text-[11px] font-semibold text-primary-foreground/90">
              {w.label}
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              {fmtDate(w.start, "dd/MM")} a {fmtDate(w.end, "dd/MM")} · {w.count} reg.
            </div>
            <div className="font-display text-sm font-bold text-success">{fmtBRL(w.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
