import type { AttendanceStatus, UUID } from "@/types/domain";

// Reference "today" used across the demo so all mocks stay consistent.
export const TODAY = {
  iso: "2026-07-24",
  label: "Jueves 24 jul",
  is_today: true,
} as const;

// Today's roll call for Aula Amarilla — matches the original demo values.
export const TODAY_ATTENDANCE_BY_STUDENT: Record<UUID, AttendanceStatus> = {
  stu_valentina_torres: "present",
  stu_mateo_quispe:     "present",
  stu_luciana_flores:   "late",
  stu_thiago_ramos:     "present",
  stu_emma_castillo:    "present",
  stu_gael_huaman:      "absent",
  stu_sofia_paredes:    "present",
  stu_adrian_vega:      "present",
  stu_mia_rojas:        "present",
  stu_liam_chavez:      "late",
};

// Month absences (pre-computed for the demo — real system derives from Attendance rows).
export const MONTH_ABSENCES_BY_STUDENT: Record<UUID, number> = {
  stu_valentina_torres: 0,
  stu_mateo_quispe:     1,
  stu_luciana_flores:   0,
  stu_thiago_ramos:     0,
  stu_emma_castillo:    2,
  stu_gael_huaman:      3,
  stu_sofia_paredes:    0,
  stu_adrian_vega:      1,
  stu_mia_rojas:        0,
  stu_liam_chavez:      1,
};

// Aggregate daily history for Aula Amarilla — kept as a display-oriented shape.
export interface AttendanceDailySummary {
  iso: string;
  label: string;
  present_count: number;
  late_count: number;
  absent_count: number;
  absent_names: string[];
  late_names: string[];
}

export const ATTENDANCE_HISTORY: AttendanceDailySummary[] = [
  { iso: "2026-07-23", label: "Miércoles 23 jul", present_count: 16, late_count: 1, absent_count: 1, absent_names: ["Gael Huamán"],   late_names: ["Luciana Flores"] },
  { iso: "2026-07-22", label: "Martes 22 jul",    present_count: 17, late_count: 1, absent_count: 0, absent_names: [],                 late_names: ["Liam Chávez"] },
  { iso: "2026-07-21", label: "Lunes 21 jul",     present_count: 15, late_count: 2, absent_count: 1, absent_names: ["Gael Huamán"],   late_names: ["Emma Castillo", "Luciana Flores"] },
  { iso: "2026-07-18", label: "Viernes 18 jul",   present_count: 18, late_count: 0, absent_count: 0, absent_names: [],                 late_names: [] },
  { iso: "2026-07-17", label: "Jueves 17 jul",    present_count: 16, late_count: 1, absent_count: 1, absent_names: ["Mateo Quispe"],   late_names: ["Gael Huamán"] },
];
