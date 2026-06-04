import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { fmtBRL, fmtDate, fmtMonth, inMonth, monthStats, type Commission } from "@/lib/commissions";

export function MonthlyReport({ list, ref }: { list: Commission[]; ref: Date }) {
  const s = monthStats(list, ref);
  const items = inMonth(list, ref).sort((a, b) => (a.date < b.date ? -1 : 1));
  const monthLabel = fmtMonth(ref);

  const exportCSV = () => {
    const rows = [
      ["Data", "Valor", "Categoria", "Cliente", "Observação"],
      ...items.map((c) => [c.date, c.value.toFixed(2), c.category ?? "", c.client ?? "", c.note ?? ""]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    download(blob, `comissoes-${monthLabel}.csv`);
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(items.map((c) => ({
      Data: c.date, Valor: c.value, Categoria: c.category ?? "", Cliente: c.client ?? "", Observação: c.note ?? "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comissões");
    XLSX.writeFile(wb, `comissoes-${monthLabel}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`Relatório de Comissões — ${monthLabel}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Total: ${fmtBRL(s.total)} · Média diária: ${fmtBRL(s.avg)} · Registros: ${s.count}`, 14, 26);
    autoTable(doc, {
      startY: 32,
      head: [["Data", "Valor", "Categoria", "Cliente", "Observação"]],
      body: items.map((c) => [fmtDate(c.date), fmtBRL(c.value), c.category ?? "", c.client ?? "", c.note ?? ""]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 50, 180] },
    });
    doc.save(`comissoes-${monthLabel}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-3xl p-5">
        <h3 className="font-display text-lg font-semibold mb-3">Relatório de {monthLabel}</h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Total" value={fmtBRL(s.total)} />
          <Stat label="Média diária" value={fmtBRL(s.avg)} />
          <Stat label="Registros" value={String(s.count)} />
          <Stat label="Melhor dia" value={s.best ? `${fmtBRL(s.best[1])}` : "—"} sub={s.best ? fmtDate(s.best[0]) : ""} />
          <Stat label="Pior dia" value={s.worst ? `${fmtBRL(s.worst[1])}` : "—"} sub={s.worst ? fmtDate(s.worst[0]) : ""} />
        </dl>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button onClick={exportPDF} variant="outline" className="rounded-2xl h-12"><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <Button onClick={exportXLSX} variant="outline" className="rounded-2xl h-12"><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button onClick={exportCSV} variant="outline" className="rounded-2xl h-12"><FileType className="mr-2 h-4 w-4" /> CSV</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft/60 p-3 border border-border/40">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg font-bold">{value}</dd>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
