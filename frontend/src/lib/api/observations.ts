import type { Observation, ObservationSource, UUID } from "@/types/domain";
import { apiFetch } from "../api";

// Shape returned by GET /observations/students/:id_student — includes competency
// name, subject name (nullable) and author full_name so lists don't need extra
// lookups.
export interface ObservationWithRelations extends Observation {
  competency: { id_competency: UUID; name: string };
  subject: { id_subject: UUID; name: string } | null;
  author: { id_user: UUID; full_name: string };
}

export interface CreateObservationInput {
  id_student: UUID;
  id_competency: UUID;
  id_subject?: UUID | null;
  content: string;
  source?: ObservationSource;
}

export function observationsForStudent(
  id_student: UUID,
): Promise<ObservationWithRelations[]> {
  return apiFetch<ObservationWithRelations[]>(
    `/observations/students/${id_student}`,
  );
}

export function createObservation(
  input: CreateObservationInput,
): Promise<Observation> {
  const body: Record<string, unknown> = {
    id_student: input.id_student,
    id_competency: input.id_competency,
    content: input.content,
  };
  if (input.id_subject) body.id_subject = input.id_subject;
  if (input.source) body.source = input.source;
  return apiFetch<Observation>("/observations", { method: "POST", body });
}

export interface GenerateObservationDraftInput {
  id_student: UUID;
  transcript: string;
  source?: ObservationSource;
}

export interface GeneratedObservationDraft {
  draft: string;
  id_competency: UUID | null;
  competency_name: string | null;
  id_subject: UUID | null;
  subject_name: string | null;
  based_on: {
    competencies_count: number;
    subjects_count: number;
  };
}

export function generateObservationDraft(
  input: GenerateObservationDraftInput,
): Promise<GeneratedObservationDraft> {
  const body: Record<string, unknown> = {
    id_student: input.id_student,
    transcript: input.transcript,
  };
  if (input.source) body.source = input.source;
  return apiFetch<GeneratedObservationDraft>("/observations/generate-draft", {
    method: "POST",
    body,
  });
}
