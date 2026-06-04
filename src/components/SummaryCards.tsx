import { TrendingDown, TrendingUp, CalendarDays, Trophy, Hash, Coins } from "lucide-react";
import { fmtBRL, fmtDate, monthStats, prevMonthDelta, type Commission } from "@/lib/commissions";

type Props = { list: Commission[]; ref: Date; today: Date };

function Stat({
  icon: Icon, label, value, accent, sub,
}: {
  icon: typeof Coins; label: string; value: string; accent?: string; sub?: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ?? "text-foreground"}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function SummaryCards({ list, ref, today }: Props) {
  const s = monthStats(list, ref);
  const todayKey = today.toISOString().slice(0, 10);
  const todayTotal = list.filter((c) => c.date === todayKey).reduce((a, c) => a + c.value, 0);
  const delta = prevMonthDelta(list, ref);
  const up = delta >= 0;

  return (
    <div className="space-y-3">
      <div className="glass-card glow-primary rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Total do mês</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-gradient">{fmtBRL(s.total)}</p>
          </div>
          <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}{delta.toFixed(1)}%
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">vs. mês anterior</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Coins} label="Comissão do dia" value={fmtBRL(todayTotal)} />
        <Stat icon={CalendarDays} label="Média diária" value={fmtBRL(s.avg)} />
        <Stat
          icon={Trophy}
          label="Melhor dia"
          value={s.best ? fmtBRL(s.best[1]) : "—"}
          sub={s.best ? fmtDate(s.best[0]) : null}
        />
        <Stat icon={Hash} label="Registros" value={String(s.count)} />
      </div>
    </div>
  );
}
