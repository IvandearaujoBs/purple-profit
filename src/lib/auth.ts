const AUTH_SESSION_KEY = "commission-pro:auth:session";
const AUTH_USERS_KEY = "commission-pro:auth:users";
const AUTH_RESET_KEY = "commission-pro:auth:pending-reset";

let currentEmail: string | null = null;
let initialized = false;

type StoredUser = {
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:changed"));
  }
}

function getStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readStoredSession(): string | null {
  return getStorage()?.getItem(AUTH_SESSION_KEY) ?? null;
}

function writeStoredSession(email: string | null) {
  const storage = getStorage();
  if (!storage) return;
  if (email) {
    storage.setItem(AUTH_SESSION_KEY, email);
  } else {
    storage.removeItem(AUTH_SESSION_KEY);
  }
}

function readUsers(): Record<string, StoredUser> {
  const storage = getStorage();
  if (!storage) return {};
  const raw = storage.getItem(AUTH_USERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function readPendingResetEmail(): string | null {
  return getStorage()?.getItem(AUTH_RESET_KEY) ?? null;
}

function writePendingResetEmail(email: string | null) {
  const storage = getStorage();
  if (!storage) return;
  if (email) {
    storage.setItem(AUTH_RESET_KEY, email);
  } else {
    storage.removeItem(AUTH_RESET_KEY);
  }
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, passwordHash: string) {
  return (await hashPassword(password)) === passwordHash;
}

export function initAuth() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentEmail = readStoredSession();
  emit();
}

export function getSession(): string | null {
  return currentEmail ?? readStoredSession();
}

export async function getUserId(): Promise<string | null> {
  return getSession();
}

export async function login(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  const users = readUsers();
  const user = users[trimmed];
  if (!user) throw new Error("Email ou senha inválidos");
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new Error("Email ou senha inválidos");
  currentEmail = trimmed;
  writeStoredSession(trimmed);
  writePendingResetEmail(null);
  emit();
}

export async function signup(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) throw new Error("Preencha email e senha");
  if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres");
  const users = readUsers();
  if (users[trimmed]) throw new Error("Este email já está cadastrado");
  const passwordHash = await hashPassword(password);
  users[trimmed] = {
    email: trimmed,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  currentEmail = trimmed;
  writeStoredSession(trimmed);
  writePendingResetEmail(null);
  emit();
}

export async function logout() {
  currentEmail = null;
  writeStoredSession(null);
  writePendingResetEmail(null);
  emit();
}

export async function sendPasswordReset(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Informe seu email");
  const users = readUsers();
  if (!users[trimmed]) throw new Error("Não existe uma conta para este email");
  writePendingResetEmail(trimmed);
}

export async function updatePassword(newPassword: string) {
  if (newPassword.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres");
  const target = currentEmail ?? readPendingResetEmail();
  if (!target) throw new Error("Nenhuma conta ativa para redefinir a senha");
  const users = readUsers();
  if (!users[target]) throw new Error("Conta não encontrada");
  users[target] = {
    ...users[target],
    passwordHash: await hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  currentEmail = target;
  writeStoredSession(target);
  writePendingResetEmail(null);
  emit();
}

export function getPendingResetEmail() {
  return readPendingResetEmail();
}
