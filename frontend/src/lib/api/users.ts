import type { UserRole, UserStatus, UUID } from "@/types/domain";
import { API_BASE_URL, ApiError, apiFetch } from "../api";
import { loadTokens } from "../auth";

// Shape returned by /users endpoints. Mirrors backend USER_SELECT.
export interface ApiUser {
  id_user: UUID;
  id_school: UUID | null;
  full_name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  role_assignments: { role: UserRole }[];
}

export interface CreateUserInput {
  id_school?: UUID | null;
  full_name: string;
  email: string;
  password?: string;
  roles: UserRole[];
  status?: UserStatus;
}

export type ImportTeacherStatus = "ok" | "observado" | "rechazado";

export interface ImportTeacherResultRow {
  fila: number;
  nombre: string;
  detalle: string;
  estado: ImportTeacherStatus;
  motivo?: string;
}

export interface ImportTeachersResponse {
  created: number;
  observed: number;
  rejected: number;
  rows: ImportTeacherResultRow[];
}

export interface UpdateUserInput {
  full_name?: string;
  status?: UserStatus;
  password?: string;
  roles?: UserRole[];
}

interface ListUsersOptions {
  role?: UserRole;
  id_school?: UUID | null;
  q?: string;
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries as [string, string][]);
  return `?${search.toString()}`;
}

export function listUsers(opts: ListUsersOptions = {}): Promise<ApiUser[]> {
  const qs = query({
    role: opts.role,
    id_school: opts.id_school ?? undefined,
    q: opts.q,
  });
  return apiFetch<ApiUser[]>(`/users${qs}`);
}

export function createUser(input: CreateUserInput): Promise<ApiUser> {
  const body: Record<string, unknown> = {
    full_name: input.full_name,
    email: input.email,
    roles: input.roles,
  };
  if (input.password) body.password = input.password;
  if (input.status) body.status = input.status;
  if (input.id_school !== null && input.id_school !== undefined) {
    body.id_school = input.id_school;
  }
  return apiFetch<ApiUser>("/users", { method: "POST", body });
}

export function previewTeachersFile(
  file: File,
  opts: { id_school?: UUID | null } = {},
): Promise<ImportTeachersResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportTeachersResponse>(
    `/users/import-teachers/preview${qs}`,
    { method: "POST", body: form },
  );
}

export function commitTeachersFile(
  file: File,
  opts: { id_school?: UUID | null } = {},
): Promise<ImportTeachersResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportTeachersResponse>(
    `/users/import-teachers/commit${qs}`,
    { method: "POST", body: form },
  );
}

export async function downloadTeachersTemplate(): Promise<void> {
  const tokens = loadTokens();
  const res = await fetch(`${API_BASE_URL}/users/import-teachers/template`, {
    headers: tokens?.access_token
      ? { Authorization: `Bearer ${tokens.access_token}` }
      : undefined,
  });
  if (!res.ok) {
    throw new ApiError(res.status, "No se pudo descargar la plantilla.", null);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-docentes.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function updateUser(
  id_user: UUID,
  input: UpdateUserInput,
  opts: { id_school?: UUID | null } = {},
): Promise<ApiUser> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<ApiUser>(`/users/${id_user}${qs}`, {
    method: "PATCH",
    body: input,
  });
}
