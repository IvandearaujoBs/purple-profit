import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, LogIn, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSession, initAuth, login, signup, sendPasswordReset } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    initAuth();
    setSession(getSession());
    const t = setTimeout(() => setReady(true), 50);
    const onChange = () => { setSession(getSession()); setReady(true); };
    window.addEventListener("auth:changed", onChange);
    return () => { clearTimeout(t); window.removeEventListener("auth:changed", onChange); };
  }, []);

  if (!ready) return null;
  if (session) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
        toast.success("Conta criada! Você já está logado.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      toast.success("Enviamos um link de recuperação para seu email");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setForgotLoading(false);
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
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
            className="h-12 bg-background/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p">Senha</Label>
          <Input id="p" type="password" required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Mínimo 6 caracteres" : ""}
            className="h-12 bg-background/40" />
        </div>

        <Button type="submit" disabled={loading}
          className="h-12 w-full rounded-2xl font-display text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary hover:opacity-90">
          {mode === "login"
            ? <><LogIn className="mr-2 h-5 w-5" /> {loading ? "Entrando..." : "Entrar"}</>
            : <><UserPlus className="mr-2 h-5 w-5" /> {loading ? "Criando..." : "Criar conta"}</>}
        </Button>

        {mode === "login" && (
          <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
            className="block w-full text-center text-xs text-primary hover:underline">
            Esqueci minha senha
          </button>
        )}

        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </form>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-popover border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Enviaremos um link para o seu email cadastrado para você criar uma nova senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForgot} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fe">Email</Label>
              <Input id="fe" type="email" required value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com" className="h-12 bg-background/40" />
            </div>
            <Button type="submit" disabled={forgotLoading}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Mail className="mr-2 h-5 w-5" />
              {forgotLoading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
