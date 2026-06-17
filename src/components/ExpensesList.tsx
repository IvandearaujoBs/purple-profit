import { useMemo, useState } from "react";
import { Pencil, Trash2, Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fmtBRL, fmtDate } from "@/lib/commissions";
import { removeExpense, type Expense } from "@/lib/expenses";
import { ExpenseForm } from "./ExpenseForm";

export function ExpensesList({ list }: { list: Expense[] }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return list
      .filter((e) => {
        if (!q) return true;
        const t = `${e.name} ${e.note ?? ""}`.toLowerCase();
        return t.includes(q.toLowerCase());
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [list, q]);

  const total = filtered.reduce((a, c) => a + c.value, 0);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-3xl p-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar consumo…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-background/40" />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} registros · Total <span className="text-destructive font-semibold">{fmtBRL(total)}</span>
        </p>
      </div>

      <div className="glass-card rounded-3xl divide-y divide-border/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum consumo registrado.</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-destructive/20 text-destructive">
                <span className="text-[10px] uppercase">{fmtDate(c.date, "MMM")}</span>
                <span className="font-display text-base font-bold leading-none">{fmtDate(c.date, "dd")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="text-destructive font-semibold">-{fmtBRL(c.value)}</span>
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmId(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-popover border-border max-w-md">
          <DialogHeader><DialogTitle className="sr-only">Editar consumo</DialogTitle></DialogHeader>
          {editing && <ExpenseForm editing={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="bg-popover border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consumo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (confirmId) removeExpense(confirmId); setConfirmId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
