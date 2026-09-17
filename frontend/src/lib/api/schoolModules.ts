import type { SchoolModule, UUID } from "@/types/domain";
import type { ModuleKey } from "@/lib/modules";
import { apiFetch } from "../api";

export function listSchoolModules(id_school: UUID): Promise<SchoolModule[]> {
  return apiFetch<SchoolModule[]>(`/schools/${id_school}/modules`);
}

export function setSchoolModule(
  id_school: UUID,
  module_key: ModuleKey,
  enabled: boolean,
): Promise<SchoolModule> {
  return apiFetch<SchoolModule>(
    `/schools/${id_school}/modules/${module_key}`,
    { method: "PUT", body: { enabled } },
  );
}
