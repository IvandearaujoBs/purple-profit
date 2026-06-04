import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths } from "date-fns";
import { fmtMonth } from "@/lib/commissions";
import { Button } from "@/components/ui/button";

type Props = { value: Date; onChange: (d: Date) => void };

export function MonthSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl glass-card px-3 py-2">
      <Button variant="ghost" size="icon" onClick={() => onChange(subMonths(value, 1))} aria-label="Mês anterior">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Resumo mensal</p>
        <p className="font-display text-lg font-semibold text-gradient">{fmtMonth(value)}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onChange(addMonths(value, 1))} aria-label="Próximo mês">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
