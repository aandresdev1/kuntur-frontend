import type { Attendance, AttendanceStatus, UUID } from "@/types/domain";
import { apiFetch } from "../api";

export interface AttendanceForClassroomRow extends Attendance {
  student: { id_student: UUID; full_name: string };
}

export function attendanceForClassroom(
  id_classroom: UUID,
  date: string,
): Promise<AttendanceForClassroomRow[]> {
  const search = new URLSearchParams({ date });
  return apiFetch<AttendanceForClassroomRow[]>(
    `/attendance/classrooms/${id_classroom}?${search.toString()}`,
  );
}

export function attendanceForStudent(
  id_student: UUID,
  opts: { from?: string; to?: string } = {},
): Promise<Attendance[]> {
  const entries: [string, string][] = [];
  if (opts.from) entries.push(["from", opts.from]);
  if (opts.to) entries.push(["to", opts.to]);
  const qs = entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
  return apiFetch<Attendance[]>(`/attendance/students/${id_student}${qs}`);
}

export interface BulkAttendanceEntry {
  id_student: UUID;
  status: AttendanceStatus;
}

export interface BulkMarkAttendanceInput {
  id_classroom: UUID;
  date: string;
  entries: BulkAttendanceEntry[];
}

export function bulkMarkAttendance(
  input: BulkMarkAttendanceInput,
): Promise<{ count: number; entries: Attendance[] }> {
  return apiFetch<{ count: number; entries: Attendance[] }>(
    "/attendance/bulk",
    { method: "POST", body: input },
  );
}
