import type { DescriptiveConclusion, UUID } from "@/types/domain";
import { apiFetch } from "../api";

export interface GenerateConclusionResponse {
  draft: string;
  based_on: number;
}

export interface DescriptiveConclusionWithConfirmer extends DescriptiveConclusion {
  confirmer: { id_user: UUID; full_name: string };
}

export function generateConclusion(
  id_student: UUID,
): Promise<GenerateConclusionResponse> {
  return apiFetch<GenerateConclusionResponse>(
    "/descriptive-conclusions/generate",
    { method: "POST", body: { id_student } },
  );
}

export function confirmConclusion(
  id_student: UUID,
  content: string,
): Promise<DescriptiveConclusion> {
  return apiFetch<DescriptiveConclusion>(
    "/descriptive-conclusions/confirm",
    { method: "POST", body: { id_student, content } },
  );
}

export function conclusionsForStudent(
  id_student: UUID,
): Promise<DescriptiveConclusionWithConfirmer[]> {
  return apiFetch<DescriptiveConclusionWithConfirmer[]>(
    `/descriptive-conclusions/students/${id_student}`,
  );
}
