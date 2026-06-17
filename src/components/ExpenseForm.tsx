import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Eraser, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { upsertExpense, type Expense } from "@/lib/expenses";

type Props = { editing?: Expense | null; onDone?: () => void; defaultDate?: Date };

export function ExpenseForm({ editing, onDone, defaultDate }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [value, setValue] = useState(editing ? String(editing.value) : "");
  const [date, setDate] = useState<Date>(editing ? new Date(editing.date) : defaultDate ?? new Date());
  const [note, setNote] = useState(editing?.note ?? "");
  const [open, setOpen] = useState(false);

  const reset = () => {
    setName(""); setValue(""); setNote(""); setDate(new Date());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Informe o produto ou estabelecimento"); return; }
    const num = Number(value.replace(",", "."));
    if (!num || num <= 0) { toast.error("Informe um valor válido"); return; }
    try {
      await upsertExpense({
        id: editing?.id,
        name: name.trim(),
        value: num,
        date: format(date, "yyyy-MM-dd"),
        note: note || undefined,
      });
      toast.success(editing ? "Consumo atualizado" : "Consumo adicionado");
      if (!editing) reset();
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };


  return (
    <form onSubmit={submit} className="glass-card rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
          <ShoppingBag className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">{editing ? "Editar consumo" : "Novo consumo"}</h3>
          <p className="text-xs text-muted-foreground">Será descontado da sua comissão</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-name">Produto / Estabelecimento</Label>
        <Input
          id="exp-name" placeholder="Ex.: Supermercado, iFood..."
          value={name} onChange={(e) => setName(e.target.value)}
          className="h-12 bg-background/40"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-value">Valor</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg text-muted-foreground">R$</span>
          <Input
            id="exp-value" inputMode="decimal" placeholder="0,00"
            value={value} onChange={(e) => setValue(e.target.value)}
            className="h-14 pl-12 text-xl font-display font-semibold bg-background/40"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className={cn("w-full h-12 justify-start font-normal bg-background/40")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "EEEE, dd/MM/yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single" selected={date}
              onSelect={(d) => { if (d) { setDate(d); setOpen(false); } }}
              initialFocus locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exp-note">Observações</Label>
        <Textarea id="exp-note" rows={2} placeholder="Detalhes opcionais" value={note} onChange={(e) => setNote(e.target.value)} className="bg-background/40 resize-none" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="h-12 flex-1 font-display text-base font-semibold rounded-2xl bg-gradient-to-r from-destructive to-accent text-primary-foreground hover:opacity-90">
          <Plus className="mr-1 h-5 w-5" />
          {editing ? "Salvar" : "Adicionar"}
        </Button>
        <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={reset}>
          <Eraser className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
