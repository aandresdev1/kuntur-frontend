import { apiFetch } from "../api";
import type { ClassroomLevel, UUID } from "@/types/domain";

export interface MyStudent {
  id_student: UUID;
  id_school: UUID;
  id_classroom: UUID | null;
  full_name: string;
  status: "active" | "withdrawn";
  birth_date: string;
  enrolled_at: string;
  classroom: {
    id_classroom: UUID;
    name: string;
    level: ClassroomLevel | null;
  } | null;
}

export type AttendanceStatus = "present" | "late" | "absent";
export type AnnouncementType = "informative" | "authorization";
export type AnnouncementScope =
  | "individual"
  | "classroom"
  | "multi_classroom"
  | "school_wide";

export interface FeedAttendance {
  id_attendance: UUID;
  id_student: UUID;
  date: string;
  status: AttendanceStatus;
  created_by: UUID;
  updated_at: string;
}

export interface FeedObservation {
  id_observation: UUID;
  id_student: UUID;
  id_classroom: UUID;
  id_subject: UUID | null;
  id_competency: UUID;
  id_user: UUID;
  content: string;
  source: "text" | "voice";
  created_at: string;
  competency: { id_competency: UUID; name: string };
  author: { id_user: UUID; full_name: string };
}

export interface FeedAnnouncementAttachment {
  id_announcement_attachment: UUID;
  file_url: string;
  file_type: "image" | "audio" | "pdf" | "document";
  file_name: string;
  file_size_bytes: number;
  duration_seconds: number | null;
}

export interface FeedAnnouncement {
  id_announcement: UUID;
  id_school: UUID;
  id_user: UUID;
  type: AnnouncementType;
  scope: AnnouncementScope;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { id_user: UUID; full_name: string };
  attachments: FeedAnnouncementAttachment[];
  read_at: string | null;
  confirmed_at: string | null;
}

export type FamilyFeedItem =
  | { kind: "attendance"; at: string; payload: FeedAttendance }
  | { kind: "observation"; at: string; payload: FeedObservation }
  | { kind: "announcement"; at: string; payload: FeedAnnouncement };

export function myStudents(): Promise<MyStudent[]> {
  return apiFetch<MyStudent[]>("/students/mine");
}

export function familyFeed(id_student: UUID, limit = 50): Promise<FamilyFeedItem[]> {
  return apiFetch<FamilyFeedItem[]>(`/students/${id_student}/feed?limit=${limit}`);
}

export function markAnnouncementRead(id: UUID): Promise<{ read_at: string }> {
  return apiFetch<{ read_at: string }>(`/announcements/${id}/read`, {
    method: "POST",
    body: {},
  });
}

export function confirmAnnouncement(id: UUID, password: string): Promise<{ confirmed_at: string }> {
  return apiFetch<{ confirmed_at: string }>(`/announcements/${id}/confirm`, {
    method: "POST",
    body: { password },
  });
}

export interface DescriptiveConclusion {
  id_descriptive_conclusion: UUID;
  id_student: UUID;
  content: string;
  generated_at: string;
  confirmed_at: string;
  confirmed_by: UUID;
  confirmer: { id_user: UUID; full_name: string };
}

export function guardianConclusions(id_student: UUID): Promise<DescriptiveConclusion[]> {
  return apiFetch<DescriptiveConclusion[]>(`/descriptive-conclusions/guardian/${id_student}`);
}
