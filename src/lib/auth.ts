const USERS_KEY = "commission-pro:users";
const SESSION_KEY = "commission-pro:session";

export type User = { username: string; password: string; createdAt: string };

export function loadUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(u: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function signup(username: string, password: string) {
  const u = username.trim().toLowerCase();
  if (!u || !password) throw new Error("Preencha usuário e senha");
  if (password.length < 4) throw new Error("Senha deve ter no mínimo 4 caracteres");
  const users = loadUsers();
  if (users.find((x) => x.username === u)) throw new Error("Usuário já existe");
  users.push({ username: u, password, createdAt: new Date().toISOString() });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, u);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

export function login(username: string, password: string) {
  const u = username.trim().toLowerCase();
  const user = loadUsers().find((x) => x.username === u);
  if (!user || user.password !== password) throw new Error("Usuário ou senha inválidos");
  localStorage.setItem(SESSION_KEY, u);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}
