const USERS_KEY = "commission-pro:users";
const SESSION_KEY = "commission-pro:session";

const PBKDF2_ITERS = 150_000;

export type User = {
  username: string;
  passwordHash: string; // base64(salt):base64(derivedKey)
  token: string;
  createdAt: string;
};

type SessionData = { username: string; token: string };

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(out);
  } else {
    for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function randomToken(): string {
  return Array.from(randomBytes(32), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey(
    "raw",
    enc,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const dk = await deriveKey(password, salt);
  return `${toB64(salt)}:${toB64(dk)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, dkB64] = stored.split(":");
  if (!saltB64 || !dkB64) return false;
  const dk = await deriveKey(password, fromB64(saltB64));
  const want = fromB64(dkB64);
  if (dk.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < dk.length; i++) diff |= dk[i] ^ want[i];
  return diff === 0;
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

export async function signup(username: string, password: string) {
  const u = username.trim().toLowerCase();
  if (!u || !password) throw new Error("Preencha usuário e senha");
  if (password.length < 4) throw new Error("Senha deve ter no mínimo 4 caracteres");
  const users = loadUsers();
  if (users.find((x) => x.username === u)) throw new Error("Usuário já existe");
  const token = randomToken();
  const passwordHash = await hashPassword(password);
  users.push({ username: u, passwordHash, token, createdAt: new Date().toISOString() });
  saveUsers(users);
  writeSession(u, token);
}

export async function login(username: string, password: string) {
  const u = username.trim().toLowerCase();
  const users = loadUsers();
  const idx = users.findIndex((x) => x.username === u);
  const user = idx >= 0 ? users[idx] : null;
  if (!user || !user.passwordHash) throw new Error("Usuário ou senha inválidos");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Usuário ou senha inválidos");
  const token = randomToken();
  users[idx] = { ...user, token };
  saveUsers(users);
  writeSession(u, token);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}
