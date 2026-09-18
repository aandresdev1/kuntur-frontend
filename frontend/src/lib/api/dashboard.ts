import { apiFetch } from "../api";
import type { UUID } from "@/types/domain";

export interface DashboardRecentAnnouncement {
  id_announcement: UUID;
  title: string;
  classroom_label: string;
  reads_count: number;
  total_count: number;
  created_at: string;
}

export interface DashboardRecentObservation {
  id_observation: UUID;
  student_name: string;
  id_student: UUID;
  classroom_name: string;
  competency_name: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface DashboardSummary {
  students_count: number;
  teachers_count: number;
  attendance_today_pct: number | null;
  recent_announcements: DashboardRecentAnnouncement[];
  recent_observations: DashboardRecentObservation[];
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard");
}
