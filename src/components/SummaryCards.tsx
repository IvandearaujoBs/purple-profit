import { TrendingDown, TrendingUp, CalendarDays, Trophy, Hash, Coins, ShoppingBag, Wallet } from "lucide-react";
import { fmtBRL, fmtDate, monthStats, prevMonthDelta, type Commission } from "@/lib/commissions";
import { expensesMonthTotal, type Expense } from "@/lib/expenses";

type Props = { list: Commission[]; expenses?: Expense[]; refDate: Date; today: Date };

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

export function SummaryCards({ list, expenses = [], refDate, today }: Props) {
  const s = monthStats(list, refDate);
  const todayKey = today.toISOString().slice(0, 10);
  const todayTotal = list.filter((c) => c.date === todayKey).reduce((a, c) => a + c.value, 0);
  const delta = prevMonthDelta(list, refDate);
  const up = delta >= 0;
  const consumo = expensesMonthTotal(expenses, refDate);
  const liquido = s.total - consumo;

  return (
    <div className="space-y-3">
      <div className="glass-card glow-primary rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Líquido do mês</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-gradient truncate">{fmtBRL(liquido)}</p>
          </div>
          <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}{delta.toFixed(1)}%
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-success/10 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
              <Wallet className="h-3 w-3" /> Bruto
            </div>
            <p className="mt-1 font-display text-lg font-bold text-success">{fmtBRL(s.total)}</p>
          </div>
          <div className="rounded-2xl bg-destructive/10 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-destructive">
              <ShoppingBag className="h-3 w-3" /> Consumo
            </div>
            <p className="mt-1 font-display text-lg font-bold text-destructive">-{fmtBRL(consumo)}</p>
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
