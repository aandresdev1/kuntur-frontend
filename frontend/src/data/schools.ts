import type { School, SchoolModule, UUID } from "@/types/domain";
import { ACTIVATABLE_MODULES } from "./platformModules";
import type { ModuleKey } from "@/lib/modules";

export const MOCK_SCHOOLS: School[] = [
  {
    id_school: "sch_los_girasoles",
    name: "Nido Los Girasoles",
    status: "active",
    created_at: "2025-03-01T10:00:00Z",
  },
  {
    id_school: "sch_san_andres",
    name: "I.E.P. San Andrés",
    status: "active",
    created_at: "2025-03-05T10:00:00Z",
  },
  {
    id_school: "sch_semillitas",
    name: "Cuna Jardín Semillitas",
    status: "active",
    created_at: "2025-04-01T10:00:00Z",
  },
  {
    id_school: "sch_rayitos",
    name: "Colegio Rayitos de Sol",
    status: "active",
    created_at: "2025-04-10T10:00:00Z",
  },
  {
    id_school: "sch_villa_maria",
    name: "I.E. Villa María",
    status: "inactive",
    created_at: "2025-05-01T10:00:00Z",
  },
  {
    id_school: "sch_alborada",
    name: "Colegio La Alborada",
    status: "active",
    created_at: "2025-05-10T10:00:00Z",
  },
];

// UI-facing presentation over School: adds subscription/plan info (not in CONTRACT
// yet — subscriptions belong to a future billing entity) and counts (derivable
// from other tables). Kept here so the demo has stable data to render.

export type SubscriptionPlan = "pilot" | "standard" | "institutional";
export type SubscriptionStatus = "active" | "trial" | "suspended";

export interface SchoolPresentation {
  id_school: UUID;
  short_label: string;
  external_code: string;
  city: string;
  plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  student_count: number;
  student_limit: number;
  teacher_count: number;
  classroom_count: number;
  subscription_expires_at: string; // ISO date
  admin_full_name: string;
  admin_email: string;
}

export const SCHOOL_PRESENTATION: Record<UUID, SchoolPresentation> = {
  sch_los_girasoles: {
    id_school: "sch_los_girasoles",
    short_label: "Girasoles",
    external_code: "GIR-001",
    city: "Surco, Lima",
    plan: "institutional",
    subscription_status: "active",
    student_count: 78,
    student_limit: 150,
    teacher_count: 9,
    classroom_count: 5,
    subscription_expires_at: "2027-03-31",
    admin_full_name: "Patricia Núñez",
    admin_email: "direccion@losgirasoles.pe",
  },
  sch_san_andres: {
    id_school: "sch_san_andres",
    short_label: "San Andrés",
    external_code: "SAN-014",
    city: "Trujillo",
    plan: "institutional",
    subscription_status: "active",
    student_count: 412,
    student_limit: 500,
    teacher_count: 31,
    classroom_count: 18,
    subscription_expires_at: "2026-12-31",
    admin_full_name: "Ricardo Vílchez",
    admin_email: "direccion@sanandres.edu.pe",
  },
  sch_semillitas: {
    id_school: "sch_semillitas",
    short_label: "Semillitas",
    external_code: "SEM-007",
    city: "Arequipa",
    plan: "standard",
    subscription_status: "active",
    student_count: 54,
    student_limit: 80,
    teacher_count: 7,
    classroom_count: 4,
    subscription_expires_at: "2026-09-30",
    admin_full_name: "Milagros Cáceres",
    admin_email: "admin@semillitas.pe",
  },
  sch_rayitos: {
    id_school: "sch_rayitos",
    short_label: "Rayitos",
    external_code: "RAY-021",
    city: "Cusco",
    plan: "pilot",
    subscription_status: "trial",
    student_count: 36,
    student_limit: 60,
    teacher_count: 5,
    classroom_count: 3,
    subscription_expires_at: "2026-09-12",
    admin_full_name: "Elena Ttito",
    admin_email: "elena@rayitosdesol.pe",
  },
  sch_villa_maria: {
    id_school: "sch_villa_maria",
    short_label: "Villa María",
    external_code: "VIM-032",
    city: "Chiclayo",
    plan: "standard",
    subscription_status: "suspended",
    student_count: 190,
    student_limit: 200,
    teacher_count: 14,
    classroom_count: 9,
    subscription_expires_at: "2026-07-31",
    admin_full_name: "Jorge Bances",
    admin_email: "jbances@villamaria.edu.pe",
  },
  sch_alborada: {
    id_school: "sch_alborada",
    short_label: "Alborada",
    external_code: "ALB-045",
    city: "Piura",
    plan: "institutional",
    subscription_status: "active",
    student_count: 268,
    student_limit: 400,
    teacher_count: 22,
    classroom_count: 13,
    subscription_expires_at: "2027-01-31",
    admin_full_name: "Carmen Zapata",
    admin_email: "czapata@laalborada.edu.pe",
  },
};

// Activated modules per school (CONTRACT §3, activable-only rows).
// Core modules are implicitly on for every school and are not stored here.
const ACTIVATION_MAP: Record<UUID, ModuleKey[]> = {
  sch_los_girasoles: [
    "ai_chat_assistant",
    "descriptive_conclusions_ai",
    "voice_input",
    "family_portfolio",
    "competency_profile",
  ],
  sch_san_andres: ["family_portfolio", "push_notifications"],
  sch_semillitas: ["family_portfolio"],
  sch_rayitos: [],
  sch_villa_maria: ["siagie_export"],
  sch_alborada: [
    "ai_chat_assistant",
    "family_portfolio",
    "push_notifications",
    "siagie_export",
  ],
};

export const MOCK_SCHOOL_MODULES: SchoolModule[] = MOCK_SCHOOLS.flatMap((s) =>
  ACTIVATABLE_MODULES.map((m) => ({
    id_school_module: `smod_${s.id_school}_${m.module_key}`,
    id_school: s.id_school,
    module_key: m.module_key,
    enabled: ACTIVATION_MAP[s.id_school]?.includes(m.module_key) ?? false,
  })),
);

export function activatedModulesForSchool(id_school: UUID): ModuleKey[] {
  return MOCK_SCHOOL_MODULES.filter(
    (row) => row.id_school === id_school && row.enabled,
  ).map((row) => row.module_key as ModuleKey);
}
