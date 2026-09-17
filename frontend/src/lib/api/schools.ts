import type { School, SchoolStatus, UUID } from "@/types/domain";
import { apiFetch } from "../api";

export interface CreateSchoolInput {
  name: string;
  status?: SchoolStatus;
}

export interface UpdateSchoolInput {
  name?: string;
  status?: SchoolStatus;
}

export function listSchools(): Promise<School[]> {
  return apiFetch<School[]>("/schools");
}

export function getSchool(id_school: UUID): Promise<School> {
  return apiFetch<School>(`/schools/${id_school}`);
}

export function createSchool(input: CreateSchoolInput): Promise<School> {
  return apiFetch<School>("/schools", { method: "POST", body: input });
}

export function updateSchool(
  id_school: UUID,
  input: UpdateSchoolInput,
): Promise<School> {
  return apiFetch<School>(`/schools/${id_school}`, {
    method: "PATCH",
    body: input,
  });
}
