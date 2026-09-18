import type {
  Classroom,
  ClassroomTeacher,
  UUID,
} from "@/types/domain";

export const MOCK_CLASSROOMS: Classroom[] = [
  { id_classroom: "cls_amarilla", id_school: "sch_los_girasoles", name: "Aula Amarilla", level: "initial_4" },
  { id_classroom: "cls_roja",     id_school: "sch_los_girasoles", name: "Aula Roja",     level: "initial_3" },
  { id_classroom: "cls_azul",     id_school: "sch_los_girasoles", name: "Aula Azul",     level: "initial_5" },
  { id_classroom: "cls_1a",       id_school: "sch_los_girasoles", name: "1° A",          level: "primary_1" },
  { id_classroom: "cls_2a",       id_school: "sch_los_girasoles", name: "2° A",          level: "primary_2" },
];

// UI-facing supplement: education level and roster size. Kept separate from
// Classroom because CONTRACT §6 keeps Classroom minimal (name only) — levels
// and student counts are derived from other tables.
export interface ClassroomPresentation {
  id_classroom: UUID;
  level_label: string;
  student_count: number;
}

export const CLASSROOM_PRESENTATION: Record<UUID, ClassroomPresentation> = {
  cls_amarilla: { id_classroom: "cls_amarilla", level_label: "Inicial · 4 años", student_count: 18 },
  cls_roja:     { id_classroom: "cls_roja",     level_label: "Inicial · 3 años", student_count: 15 },
  cls_azul:     { id_classroom: "cls_azul",     level_label: "Inicial · 5 años", student_count: 20 },
  cls_1a:       { id_classroom: "cls_1a",       level_label: "Primaria · 1° grado", student_count: 24 },
  cls_2a:       { id_classroom: "cls_2a",       level_label: "Primaria · 2° grado", student_count: 22 },
};

// Classroom teacher assignments (CONTRACT §7). Only lead/assistant roles here,
// no subject-specific rows for the initial-level demo.
export const MOCK_CLASSROOM_TEACHERS: ClassroomTeacher[] = [
  { id_classroom_teacher: "ct_001", id_classroom: "cls_amarilla", id_user: "usr_carla_mendoza", id_subject: null, role: "lead" },
  { id_classroom_teacher: "ct_002", id_classroom: "cls_amarilla", id_user: "usr_diego_salas",   id_subject: null, role: "assistant" },
  { id_classroom_teacher: "ct_003", id_classroom: "cls_roja",     id_user: "usr_rosa_ttito",    id_subject: null, role: "lead" },
  { id_classroom_teacher: "ct_004", id_classroom: "cls_1a",       id_user: "usr_fernanda_leon", id_subject: null, role: "lead" },
];

export function leadTeacherForClassroom(id_classroom: UUID): UUID | null {
  return (
    MOCK_CLASSROOM_TEACHERS.find(
      (ct) => ct.id_classroom === id_classroom && ct.role === "lead",
    )?.id_user ?? null
  );
}

export function classroomsForTeacher(id_user: UUID): UUID[] {
  return MOCK_CLASSROOM_TEACHERS.filter((ct) => ct.id_user === id_user).map(
    (ct) => ct.id_classroom,
  );
}
