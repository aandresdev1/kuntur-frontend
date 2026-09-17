import type { Subject, UUID } from "@/types/domain";
import { apiFetch } from "../api";

export interface CreateSubjectInput {
  id_school?: UUID | null;
  name: string;
  status?: "active" | "inactive";
}

export interface UpdateSubjectInput {
  name?: string;
  status?: "active" | "inactive";
}

interface ListOptions {
  id_school?: UUID | null;
  include_inactive?: boolean;
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries as [string, string][]);
  return `?${search.toString()}`;
}

export function listSubjects(opts: ListOptions = {}): Promise<Subject[]> {
  const qs = query({
    id_school: opts.id_school ?? undefined,
    include_inactive: opts.include_inactive ? "true" : undefined,
  });
  return apiFetch<Subject[]>(`/subjects${qs}`);
}

export function createSubject(
  input: CreateSubjectInput,
): Promise<Subject> {
  const body: Record<string, unknown> = { name: input.name };
  if (input.id_school) body.id_school = input.id_school;
  if (input.status) body.status = input.status;
  return apiFetch<Subject>("/subjects", { method: "POST", body });
}

export function updateSubject(
  id_subject: UUID,
  input: UpdateSubjectInput,
  opts: { id_school?: UUID | null } = {},
): Promise<Subject> {
  const qs = query({ id_school: opts.id_school ?? undefined });
  return apiFetch<Subject>(`/subjects/${id_subject}${qs}`, {
    method: "PATCH",
    body: input,
  });
}
