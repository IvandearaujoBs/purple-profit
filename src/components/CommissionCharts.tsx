import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { cumulativeSeries, dailySeries, fmtBRL, type Commission } from "@/lib/commissions";

const tooltipStyle = {
  background: "oklch(0.18 0.08 275)",
  border: "1px solid oklch(1 0 0 / 15%)",
  borderRadius: 12,
  color: "white",
  fontSize: 12,
};

export function CommissionCharts({ list, ref }: { list: Commission[]; ref: Date }) {
  const daily = dailySeries(list, ref);
  const cum = cumulativeSeries(list, ref);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="glass-card rounded-3xl p-5">
        <h3 className="mb-3 font-display text-base font-semibold">Comissões por dia</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={daily}>
              <defs>
                <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.20 290)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.22 265)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis dataKey="day" tick={{ fill: "oklch(0.78 0.04 275)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.78 0.04 275)", fontSize: 11 }} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtBRL(v), "Valor"]}
                labelFormatter={(l) => `Dia ${l}`}
              />
              <Bar dataKey="value" fill="url(#barG)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <h3 className="mb-3 font-display text-base font-semibold">Evolução acumulada</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={cum}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" />
              <XAxis dataKey="day" tick={{ fill: "oklch(0.78 0.04 275)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.78 0.04 275)", fontSize: 11 }} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [fmtBRL(v), "Acumulado"]}
                labelFormatter={(l) => `Dia ${l}`}
              />
              <Line
                type="monotone" dataKey="acumulado"
                stroke="oklch(0.78 0.18 155)" strokeWidth={3}
                dot={{ r: 3, fill: "oklch(0.78 0.18 155)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
