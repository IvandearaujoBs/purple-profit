import { useMemo, useState } from "react";
import { parseISO } from "date-fns";
import { Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { fmtBRL, fmtDate, remove, type Commission } from "@/lib/commissions";
import { CommissionForm } from "./CommissionForm";

export function RegistrosList({ list }: { list: Commission[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [editing, setEditing] = useState<Commission | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return list
      .filter((c) => {
        const text = (c.note ?? "").toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (from && c.date < from) return false;
        if (to && c.date > to) return false;
        if (min && c.value < Number(min)) return false;
        if (max && c.value > Number(max)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [list, q, from, to, min, max]);

  const total = filtered.reduce((a, c) => a + c.value, 0);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-3xl p-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por observação…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-background/40" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-background/40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-background/40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor mín.</Label>
            <Input type="number" placeholder="0" value={min} onChange={(e) => setMin(e.target.value)} className="bg-background/40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor máx.</Label>
            <Input type="number" placeholder="0" value={max} onChange={(e) => setMax(e.target.value)} className="bg-background/40" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} registros · Total <span className="text-success font-semibold">{fmtBRL(total)}</span>
        </p>
      </div>

      <div className="glass-card rounded-3xl divide-y divide-border/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
                <span className="text-[10px] uppercase">{fmtDate(c.date, "MMM")}</span>
                <span className="font-display text-base font-bold leading-none">{fmtDate(c.date, "dd")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold">{fmtBRL(c.value)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[c.category, c.client, c.note].filter(Boolean).join(" · ") || fmtDate(c.date, "EEEE")}
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
          <DialogHeader><DialogTitle className="sr-only">Editar</DialogTitle></DialogHeader>
          {editing && <CommissionForm editing={editing} onDone={() => setEditing(null)} />}
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
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (confirmId) remove(confirmId); setConfirmId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
