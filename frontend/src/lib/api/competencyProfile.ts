import type { UUID } from "@/types/domain";
import { apiFetch } from "../api";

// Shape returned by /competency-profile/students/:id — see backend
// CompetencyProfileService. Labels are enum-strings we render as chips.
export interface CompetencyLabel {
  competency: string;
  count: number;
  label: "en_desarrollo" | "reforzando" | "fortaleza";
}

export interface AttendanceLabel {
  type: string; // "punctuality" | "consistency" | "adaptation"
  value: number;
  label: string; // see COMPETENCY_CALCULATION.md
}

export interface CompetencyProfileResponse {
  id_student: UUID;
  competency_labels: CompetencyLabel[];
  attendance_labels: AttendanceLabel[];
  last_calculated_at: string;
}

export function competencyProfileForStudent(
  id_student: UUID,
): Promise<CompetencyProfileResponse> {
  return apiFetch<CompetencyProfileResponse>(
    `/competency-profile/students/${id_student}`,
  );
}
