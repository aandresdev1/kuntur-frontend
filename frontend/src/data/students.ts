import type { Student, StudentGuardian, UUID } from "@/types/domain";

export const MOCK_STUDENTS: Student[] = [
  {
    id_student: "stu_valentina_torres",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Valentina Torres",
    status: "active",
    birth_date: "2022-04-12",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_mateo_quispe",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Mateo Quispe",
    status: "active",
    birth_date: "2022-06-18",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_luciana_flores",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Luciana Flores",
    status: "active",
    birth_date: "2022-02-09",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_thiago_ramos",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Thiago Ramos",
    status: "active",
    birth_date: "2022-05-23",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_emma_castillo",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Emma Castillo",
    status: "active",
    birth_date: "2022-01-30",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_gael_huaman",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Gael Huamán",
    status: "active",
    birth_date: "2022-08-05",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_sofia_paredes",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Sofía Paredes",
    status: "active",
    birth_date: "2022-03-14",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_adrian_vega",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Adrián Vega",
    status: "active",
    birth_date: "2022-07-22",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_mia_rojas",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Mía Rojas",
    status: "active",
    birth_date: "2022-09-11",
    enrolled_at: "2026-03-01",
  },
  {
    id_student: "stu_liam_chavez",
    id_school: "sch_los_girasoles",
    id_classroom: "cls_amarilla",
    full_name: "Liam Chávez",
    status: "active",
    birth_date: "2022-05-08",
    enrolled_at: "2026-03-01",
  },
];

// Guardian links. For the demo only Carlos Torres (Valentina's dad) has a User
// account; the other guardian names come from `STUDENT_PRESENTATION` below and
// exist only as display text — not as Users in this mock.
export const MOCK_STUDENT_GUARDIANS: StudentGuardian[] = [
  {
    id_student_guardian: "sg_001",
    id_student: "stu_valentina_torres",
    id_user: "usr_carlos_torres",
  },
];

// UI-facing supplement: pretty guardian labels used in lists where we don't
// have a corresponding User row yet (demo pragmatism).
export interface StudentPresentation {
  id_student: UUID;
  guardian_display_name: string;
}

export const STUDENT_PRESENTATION: Record<UUID, StudentPresentation> = {
  stu_valentina_torres: { id_student: "stu_valentina_torres", guardian_display_name: "Carlos Torres" },
  stu_mateo_quispe:     { id_student: "stu_mateo_quispe",     guardian_display_name: "Rosa Quispe" },
  stu_luciana_flores:   { id_student: "stu_luciana_flores",   guardian_display_name: "María Flores" },
  stu_thiago_ramos:     { id_student: "stu_thiago_ramos",     guardian_display_name: "Jorge Ramos" },
  stu_emma_castillo:    { id_student: "stu_emma_castillo",    guardian_display_name: "Ana Castillo" },
  stu_gael_huaman:      { id_student: "stu_gael_huaman",      guardian_display_name: "Pedro Huamán" },
  stu_sofia_paredes:    { id_student: "stu_sofia_paredes",    guardian_display_name: "Lucía Paredes" },
  stu_adrian_vega:      { id_student: "stu_adrian_vega",      guardian_display_name: "Marco Vega" },
  stu_mia_rojas:        { id_student: "stu_mia_rojas",        guardian_display_name: "Carmen Rojas" },
  stu_liam_chavez:      { id_student: "stu_liam_chavez",      guardian_display_name: "Diego Chávez" },
};

const BY_ID: Record<UUID, Student> = Object.fromEntries(
  MOCK_STUDENTS.map((s) => [s.id_student, s]),
);

export function findStudentById(id_student: UUID): Student | null {
  return BY_ID[id_student] ?? null;
}

export function studentsInClassroom(id_classroom: UUID): Student[] {
  return MOCK_STUDENTS.filter((s) => s.id_classroom === id_classroom);
}

export function studentsForGuardian(id_user: UUID): Student[] {
  const linked = MOCK_STUDENT_GUARDIANS.filter((g) => g.id_user === id_user).map(
    (g) => g.id_student,
  );
  return MOCK_STUDENTS.filter((s) => linked.includes(s.id_student));
}
