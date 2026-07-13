import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPendingResetEmail, updatePassword, initAuth, getSession } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Comissão Pro" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initAuth();
    const pendingResetEmail = getPendingResetEmail() ?? getSession();
    setHasSession(Boolean(pendingResetEmail));
    setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Senha redefinida com sucesso!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-card glow-primary w-full max-w-sm rounded-3xl p-6 space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Redefinir senha</h1>
            <p className="text-xs text-muted-foreground mt-1">Crie uma nova senha para sua conta</p>
          </div>
        </div>

        {!hasSession ? (
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>Link inválido ou expirado. Solicite um novo email de recuperação.</p>
            <Button onClick={() => navigate({ to: "/" })} variant="outline" className="w-full rounded-2xl">
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">Nova senha</Label>
              <Input id="np" type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" className="h-12 bg-background/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">Confirmar senha</Label>
              <Input id="cp" type="password" required minLength={6}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="h-12 bg-background/40" />
            </div>
            <Button type="submit" disabled={loading}
              className="h-12 w-full rounded-2xl font-display text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary">
              <KeyRound className="mr-2 h-5 w-5" />
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
