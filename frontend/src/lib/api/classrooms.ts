import type {
  Classroom,
  ClassroomLevel,
  ClassroomTeacher,
  ClassroomTeacherRole,
  Subject,
  UUID,
} from "@/types/domain";
import { API_BASE_URL, ApiError, apiFetch } from "../api";
import { loadTokens } from "../auth";

// Shape returned by GET /classrooms/:id_classroom. Includes teacher_links
// eagerly so the UI can show assigned teachers without an extra roundtrip.
export interface ClassroomWithLinks extends Classroom {
  teacher_links: (ClassroomTeacher & {
    user: { id_user: UUID; full_name: string; email: string };
    subject: Pick<Subject, "id_subject" | "name"> | null;
  })[];
}

export interface CreateClassroomInput {
  id_school?: UUID | null;
  name: string;
  level: ClassroomLevel;
}

export interface UpdateClassroomInput {
  name?: string;
  level?: ClassroomLevel;
}

export interface AssignTeacherInput {
  id_user: UUID;
  role: ClassroomTeacherRole;
  id_subject?: UUID | null;
}

export type ImportClassroomStatus = "ok" | "observado" | "rechazado";

export interface ImportClassroomResultRow {
  fila: number;
  nombre: string;
  detalle: string;
  estado: ImportClassroomStatus;
  motivo?: string;
}

export interface ImportClassroomsResponse {
  created: number;
  observed: number;
  rejected: number;
  rows: ImportClassroomResultRow[];
}

interface ListOptions {
  id_school?: UUID | null;
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries as [string, string][]);
  return `?${search.toString()}`;
}

export function listClassrooms(opts: ListOptions = {}): Promise<Classroom[]> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<Classroom[]>(`/classrooms${qs}`);
}

export function getClassroom(
  id_classroom: UUID,
  opts: ListOptions = {},
): Promise<ClassroomWithLinks> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<ClassroomWithLinks>(`/classrooms/${id_classroom}${qs}`);
}

export function createClassroom(
  input: CreateClassroomInput,
): Promise<Classroom> {
  const body: Record<string, unknown> = {
    name: input.name,
    level: input.level,
  };
  if (input.id_school) body.id_school = input.id_school;
  return apiFetch<Classroom>("/classrooms", { method: "POST", body });
}

export function updateClassroom(
  id_classroom: UUID,
  input: UpdateClassroomInput,
  opts: ListOptions = {},
): Promise<Classroom> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.level !== undefined) body.level = input.level;
  return apiFetch<Classroom>(`/classrooms/${id_classroom}${qs}`, {
    method: "PATCH",
    body,
  });
}

export function assignTeacher(
  id_classroom: UUID,
  input: AssignTeacherInput,
  opts: ListOptions = {},
): Promise<ClassroomTeacher> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const body: Record<string, unknown> = {
    id_user: input.id_user,
    role: input.role,
  };
  if (input.id_subject) body.id_subject = input.id_subject;
  return apiFetch<ClassroomTeacher>(
    `/classrooms/${id_classroom}/teachers${qs}`,
    { method: "POST", body },
  );
}

export function unassignTeacher(
  id_classroom: UUID,
  id_classroom_teacher: UUID,
  opts: ListOptions = {},
): Promise<{ deleted: true }> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<{ deleted: true }>(
    `/classrooms/${id_classroom}/teachers/${id_classroom_teacher}${qs}`,
    { method: "DELETE" },
  );
}

export function previewClassroomsFile(
  file: File,
  opts: ListOptions = {},
): Promise<ImportClassroomsResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportClassroomsResponse>(
    `/classrooms/import-classrooms/preview${qs}`,
    { method: "POST", body: form },
  );
}

export function commitClassroomsFile(
  file: File,
  opts: ListOptions = {},
): Promise<ImportClassroomsResponse> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ImportClassroomsResponse>(
    `/classrooms/import-classrooms/commit${qs}`,
    { method: "POST", body: form },
  );
}

export async function downloadClassroomsTemplate(): Promise<void> {
  const tokens = loadTokens();
  const res = await fetch(
    `${API_BASE_URL}/classrooms/import-classrooms/template`,
    {
      headers: tokens?.access_token
        ? { Authorization: `Bearer ${tokens.access_token}` }
        : undefined,
    },
  );
  if (!res.ok) {
    throw new ApiError(res.status, "No se pudo descargar la plantilla.", null);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-aulas.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
