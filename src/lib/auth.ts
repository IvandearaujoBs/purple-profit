const USERS_KEY = "commission-pro:users";
const SESSION_KEY = "commission-pro:session";

export type User = {
  username: string;
  password: string;
  token: string;
  createdAt: string;
};

type SessionData = { username: string; token: string };

function randomToken(): string {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

function readSessionRaw(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.username === "string" &&
      typeof parsed.token === "string"
    ) {
      return parsed as SessionData;
    }
  } catch {
    // legacy plain-string sessions are no longer trusted
  }
  return null;
}

export function getSession(): string | null {
  const s = readSessionRaw();
  if (!s) return null;
  const user = loadUsers().find((x) => x.username === s.username);
  // Validate the session token matches the issued token. Tampering with
  // localStorage (changing username, inventing a session) fails this check.
  if (!user || !user.token || user.token !== s.token) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return s.username;
}

function writeSession(username: string, token: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, token }));
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

export function signup(username: string, password: string) {
  const u = username.trim().toLowerCase();
  if (!u || !password) throw new Error("Preencha usuário e senha");
  if (password.length < 4) throw new Error("Senha deve ter no mínimo 4 caracteres");
  const users = loadUsers();
  if (users.find((x) => x.username === u)) throw new Error("Usuário já existe");
  const token = randomToken();
  users.push({ username: u, password, token, createdAt: new Date().toISOString() });
  saveUsers(users);
  writeSession(u, token);
}

export function login(username: string, password: string) {
  const u = username.trim().toLowerCase();
  const users = loadUsers();
  const idx = users.findIndex((x) => x.username === u);
  const user = idx >= 0 ? users[idx] : null;
  if (!user || user.password !== password) throw new Error("Usuário ou senha inválidos");
  // Rotate token on each login so old sessions can't be replayed.
  const token = randomToken();
  users[idx] = { ...user, token };
  saveUsers(users);
  writeSession(u, token);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}
