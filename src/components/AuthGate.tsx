import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession, login, signup } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  useEffect(() => {
    setSession(getSession());
    setReady(true);
    const onChange = () => setSession(getSession());
    window.addEventListener("auth:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auth:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!ready) return null;
  if (session) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") login(u, p);
      else { signup(u, p); toast.success("Conta criada!"); }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="glass-card glow-primary w-full max-w-sm rounded-3xl p-6 space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              Comissão <span className="text-gradient">Pro</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="u">Usuário</Label>
          <Input id="u" autoCapitalize="none" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} className="h-12 bg-background/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p">Senha</Label>
          <Input id="p" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={p} onChange={(e) => setP(e.target.value)} className="h-12 bg-background/40" />
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl font-display text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary hover:opacity-90">
          {mode === "login" ? <><LogIn className="mr-2 h-5 w-5" /> Entrar</> : <><UserPlus className="mr-2 h-5 w-5" /> Criar conta</>}
        </Button>

        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}
