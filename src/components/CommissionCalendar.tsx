import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fmtBRL, remove, type Commission } from "@/lib/commissions";
import { CommissionForm } from "./CommissionForm";
import { cn } from "@/lib/utils";

type Props = { list: Commission[]; month: Date; onMonthChange: (d: Date) => void };

export function CommissionCalendar({ list, month, onMonthChange }: Props) {
  const [selected, setSelected] = useState<Date | undefined>();
  const [editing, setEditing] = useState<Commission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, Commission[]>();
    list.forEach((c) => {
      const arr = m.get(c.date) ?? [];
      arr.push(c);
      m.set(c.date, arr);
    });
    return m;
  }, [list]);

  const dayKey = selected ? format(selected, "yyyy-MM-dd") : "";
  const dayItems = selected ? (byDate.get(dayKey) ?? []) : [];
  const dayTotal = dayItems.reduce((a, c) => a + c.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
      <div className="glass-card rounded-3xl p-3">
        <Calendar
          mode="single" selected={selected} onSelect={setSelected}
          month={month} onMonthChange={onMonthChange} locale={ptBR}
          className={cn("p-2 pointer-events-auto")}
          modifiers={{ hasCommission: (d) => byDate.has(format(d, "yyyy-MM-dd")) }}
          modifiersClassNames={{
            hasCommission: "relative font-semibold text-success after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-success",
          }}
        />
      </div>

      <div className="glass-card rounded-3xl p-5">
        {!selected ? (
          <p className="text-sm text-muted-foreground">Selecione um dia no calendário para ver os registros.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {format(selected, "EEEE", { locale: ptBR })}
                </p>
                <p className="font-display text-xl font-bold">{format(selected, "dd 'de' MMMM", { locale: ptBR })}</p>
                <p className="text-sm text-success font-semibold">{fmtBRL(dayTotal)} · {dayItems.length} reg.</p>
              </div>
              <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </div>

            {dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro neste dia.</p>
            ) : (
              <div className="space-y-2">
                {dayItems.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface-soft/60 p-3 border border-border/40">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold">{fmtBRL(c.value)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.category, c.client, c.note].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmId(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-popover border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{editing ? "Editar" : "Nova"} comissão</DialogTitle>
          </DialogHeader>
          <CommissionForm
            editing={editing}
            defaultDate={selected}
            onDone={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comissão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (confirmId) remove(confirmId); setConfirmId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
