import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wallet, LayoutDashboard, CalendarRange, ListChecks, FileBarChart2, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCommissions } from "@/hooks/use-commissions";
import { MonthSelector } from "@/components/MonthSelector";
import { SummaryCards } from "@/components/SummaryCards";
import { CommissionForm } from "@/components/CommissionForm";
import { WeeklyBreakdown } from "@/components/WeeklyBreakdown";
import { CommissionCharts } from "@/components/CommissionCharts";
import { CommissionCalendar } from "@/components/CommissionCalendar";
import { RegistrosList } from "@/components/RegistrosList";
import { MonthlyReport } from "@/components/MonthlyReport";
import { AuthGate } from "@/components/AuthGate";
import { getSession, logout } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comissão Pro — Controle de comissões diárias" },
      { name: "description", content: "Aplicativo para registrar, acompanhar e analisar comissões de vendas com dashboard, calendário, gráficos e relatórios." },
      { property: "og:title", content: "Comissão Pro" },
      { property: "og:description", content: "Controle moderno de comissões com dashboard, gráficos e relatórios exportáveis." },
    ],
  }),
  component: Index,
});

function Index() {
  const [month, setMonth] = useState<Date>(new Date());
  const today = new Date();
  const list = useCommissions();

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold leading-none">
              Comissão <span className="text-gradient">Pro</span>
            </h1>
            <p className="text-xs text-muted-foreground">Controle diário de comissões</p>
          </div>
        </div>
      </header>

      <div className="mb-5">
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      <Tabs defaultValue="dashboard" className="space-y-5">
        <TabsList className="glass-card grid w-full grid-cols-4 rounded-2xl p-1 h-12">
          <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="calendario" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <CalendarRange className="h-4 w-4" /> <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="registros" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <ListChecks className="h-4 w-4" /> <span className="hidden sm:inline">Registros</span>
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
            <FileBarChart2 className="h-4 w-4" /> <span className="hidden sm:inline">Relatório</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-5">
          <SummaryCards list={list} ref={month} today={today} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <CommissionCharts list={list} ref={month} />
              <WeeklyBreakdown list={list} ref={month} />
            </div>
            <CommissionForm defaultDate={today} />
          </div>
        </TabsContent>

        <TabsContent value="calendario">
          <CommissionCalendar list={list} month={month} onMonthChange={setMonth} />
        </TabsContent>

        <TabsContent value="registros">
          <RegistrosList list={list} />
        </TabsContent>

        <TabsContent value="relatorio">
          <MonthlyReport list={list} ref={month} />
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Dados salvos localmente · pronto para integração com Supabase
      </footer>
    </div>
  );
}
