import type { Competency } from "@/types/domain";
import { apiFetch } from "../api";

export function listCompetencies(): Promise<Competency[]> {
  return apiFetch<Competency[]>("/competencies");
}
