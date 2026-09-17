import type { Student, StudentGuardian, StudentStatus, UUID } from "@/types/domain";
import { API_BASE_URL, ApiError, apiFetch } from "../api";
import { loadTokens } from "../auth";

// Shape returned by GET /students/:id_student — includes classroom summary and
// guardian_links resolved to their user record.
export interface StudentWithRelations extends Student {
  classroom: { id_classroom: UUID; name: string } | null;
  guardian_links: {
    id_student_guardian: UUID;
    id_student: UUID;
    id_user: UUID;
    user: { id_user: UUID; full_name: string; email: string };
  }[];
}

export interface CreateStudentInput {
  id_school?: UUID | null;
  id_classroom?: UUID | null;
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  enrolled_at: string; // YYYY-MM-DD
  status?: StudentStatus;
}

export interface UpdateStudentInput {
  full_name?: string;
  id_classroom?: UUID | null;
  birth_date?: string;
  enrolled_at?: string;
  status?: StudentStatus;
}

export type ImportStudentStatus = "ok" | "observado" | "rechazado";

export interface ImportStudentResultRow {
  fila: number;
  nombre: string;
  detalle: string;
  estado: ImportStudentStatus;
  motivo?: string;
}

export interface ImportStudentsResponse {
  created: number;
  observed: number;
  rejected: number;
  rows: ImportStudentResultRow[];
}

interface ListOptions {
  id_school?: UUID | null;
  id_classroom?: UUID;
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

export function listStudents(opts: ListOptions = {}): Promise<Student[]> {
  const qs = query({
    id_school: opts.id_school ?? undefined,
    id_classroom: opts.id_classroom,
    q: opts.q,
  });
  return apiFetch<Student[]>(`/students${qs}`);
}

export function getStudent(
  id_student: UUID,
  opts: { id_school?: UUID | null } = {},
): Promise<StudentWithRelations> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<StudentWithRelations>(`/students/${id_student}${qs}`);
}

export function createStudent(input: CreateStudentInput): Promise<Student> {
  const body: Record<string, unknown> = {
    full_name: input.full_name,
    birth_date: input.birth_date,
    enrolled_at: input.enrolled_at,
  };
  if (input.id_school) body.id_school = input.id_school;
  if (input.id_classroom) body.id_classroom = input.id_classroom;
  if (input.status) body.status = input.status;
  return apiFetch<Student>("/students", { method: "POST", body });
}

export function updateStudent(
  id_student: UUID,
  input: UpdateStudentInput,
  opts: { id_school?: UUID | null } = {},
): Promise<Student> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<Student>(`/students/${id_student}${qs}`, {
    method: "PATCH",
    body: input,
  });
}

export function assignGuardian(
  id_student: UUID,
  id_user: UUID,
  opts: { id_school?: UUID | null } = {},
): Promise<StudentGuardian> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<StudentGuardian>(
    `/students/${id_student}/guardians${qs}`,
    { method: "POST", body: { id_user } },
  );
}

export function unassignGuardian(
  id_student: UUID,
  id_student_guardian: UUID,
  opts: { id_school?: UUID | null } = {},
): Promise<{ deleted: true }> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<{ deleted: true }>(
    `/students/${id_student}/guardians/${id_student_guardian}${qs}`,
    { method: "DELETE" },
  );
}

export function previewStudentsFile(
  file: File,
  opts: { id_school?: UUID | null } = {},
): Promise<ImportStudentsResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportStudentsResponse>(
    `/students/import-students/preview${qs}`,
    { method: "POST", body: form },
  );
}

export function commitStudentsFile(
  file: File,
  opts: { id_school?: UUID | null } = {},
): Promise<ImportStudentsResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportStudentsResponse>(
    `/students/import-students/commit${qs}`,
    { method: "POST", body: form },
  );
}

export async function downloadStudentsTemplate(): Promise<void> {
  const tokens = loadTokens();
  const res = await fetch(`${API_BASE_URL}/students/import-students/template`, {
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
  link.download = "plantilla-alumnos.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
