import type { Session, UserRole, UUID } from "@/types/domain";
import { apiFetch } from "./api";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  id_user: UUID;
  full_name: string;
  email: string;
  id_school: UUID | null;
  school_name: string | null;
  roles: UserRole[];
}

const TOKENS_KEY = "kuntur.auth.tokens";

// super_admin outranks school_admin outranks teacher outranks guardian.
// When a user has multiple roles the highest one drives the UI.
const ROLE_PRIORITY: UserRole[] = [
  "super_admin",
  "school_admin",
  "teacher",
  "guardian",
];

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Superadministrador",
  school_admin: "Dirección",
  teacher: "Docente",
  guardian: "Familia",
};

export function loadTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  window.localStorage.removeItem(TOKENS_KEY);
}

export function pickPrimaryRole(roles: UserRole[]): UserRole {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return "guardian";
}

export function toSession(user: AuthUser): Session {
  const role = pickPrimaryRole(user.roles);
  return {
    id_user: user.id_user,
    id_school: user.id_school,
    school_name: user.school_name,
    full_name: user.full_name,
    role,
    role_label: ROLE_LABEL[role],
  };
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me", { method: "GET" });
}

export async function refreshTokens(): Promise<AuthTokens> {
  const tokens = loadTokens();
  if (!tokens?.refresh_token) {
    throw new Error("No refresh token available");
  }
  return apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    auth: false,
    headers: { Authorization: `Bearer ${tokens.refresh_token}` },
  });
}
