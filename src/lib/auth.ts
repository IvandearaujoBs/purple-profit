import { supabase } from "@/integrations/supabase/client";

let currentEmail: string | null = null;
let initialized = false;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:changed"));
  }
}

async function refresh(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email ?? null;
  if (email !== currentEmail) {
    currentEmail = email;
    emit();
  }
  return currentEmail;
}

export function initAuth() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  void refresh();
  supabase.auth.onAuthStateChange((_event, session) => {
    const email = session?.user?.email ?? null;
    if (email !== currentEmail) {
      currentEmail = email;
      emit();
    }
  });
}

export function getSession(): string | null {
  return currentEmail;
}

export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      throw new Error("Email ou senha inválidos");
    }
    throw new Error(error.message);
  }
  await refresh();
}

export async function signup(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) throw new Error("Preencha email e senha");
  if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres");
  const { error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      throw new Error("Este email já está cadastrado");
    }
    throw new Error(error.message);
  }
  await refresh();
}

export async function logout() {
  await supabase.auth.signOut();
  currentEmail = null;
  emit();
}

export async function sendPasswordReset(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Informe seu email");
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
