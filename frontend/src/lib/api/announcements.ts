import type {
  Announcement,
  AnnouncementConfirmation,
  AnnouncementRead,
  AnnouncementRecipient,
  AnnouncementScope,
  AnnouncementType,
  UUID,
} from "@/types/domain";
import { apiFetch } from "../api";

// Shape returned by GET /announcements — the backend includes recipients,
// attachments and author (see ANNOUNCEMENT_INCLUDE). Reads/confirmations are
// NOT included in the payload today.
export interface AnnouncementWithRelations extends Announcement {
  recipients: AnnouncementRecipient[];
  attachments: {
    id_announcement_attachment: UUID;
    id_announcement: UUID;
    file_url: string;
    file_type: "image" | "video";
    file_name: string;
    file_size_bytes: number;
    duration_seconds: number | null;
    uploaded_by: UUID;
    created_at: string;
  }[];
  author: { id_user: UUID; full_name: string };
}

export interface CreateAnnouncementInput {
  type: AnnouncementType;
  scope: AnnouncementScope;
  title: string;
  content: string;
  id_students?: UUID[];
  id_classrooms?: UUID[];
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
}

interface ListOptions {
  type?: AnnouncementType;
  id_student?: UUID;
  q?: string;
}

function query(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
}

export function listAnnouncements(
  opts: ListOptions = {},
): Promise<AnnouncementWithRelations[]> {
  const qs = query({ type: opts.type, id_student: opts.id_student, q: opts.q });
  return apiFetch<AnnouncementWithRelations[]>(`/announcements${qs}`);
}

export function getAnnouncement(
  id_announcement: UUID,
): Promise<AnnouncementWithRelations> {
  return apiFetch<AnnouncementWithRelations>(
    `/announcements/${id_announcement}`,
  );
}

export function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<AnnouncementWithRelations> {
  return apiFetch<AnnouncementWithRelations>(`/announcements`, {
    method: "POST",
    body: input,
  });
}

export interface GenerateAnnouncementDraftInput {
  transcript: string;
}

export interface GeneratedAnnouncementDraft {
  title: string;
  content: string;
  type: AnnouncementType;
}

export function generateAnnouncementDraft(
  input: GenerateAnnouncementDraftInput,
): Promise<GeneratedAnnouncementDraft> {
  return apiFetch<GeneratedAnnouncementDraft>(`/announcements/generate-draft`, {
    method: "POST",
    body: { transcript: input.transcript },
  });
}

export function updateAnnouncement(
  id_announcement: UUID,
  input: UpdateAnnouncementInput,
): Promise<AnnouncementWithRelations> {
  return apiFetch<AnnouncementWithRelations>(
    `/announcements/${id_announcement}`,
    { method: "PATCH", body: input },
  );
}

export interface AnnouncementReadStatusRow {
  id_user: UUID;
  full_name: string;
  id_student: UUID | null;
  student_name: string | null;
  read_at: string | null;
  confirmed_at: string | null;
}

export function getAnnouncementStatus(
  id_announcement: UUID,
): Promise<AnnouncementReadStatusRow[]> {
  return apiFetch<AnnouncementReadStatusRow[]>(
    `/announcements/${id_announcement}/status`,
  );
}

export function markAnnouncementRead(
  id_announcement: UUID,
): Promise<AnnouncementRead> {
  return apiFetch<AnnouncementRead>(
    `/announcements/${id_announcement}/read`,
    { method: "POST" },
  );
}

export function confirmAnnouncement(
  id_announcement: UUID,
  password: string,
): Promise<AnnouncementConfirmation> {
  return apiFetch<AnnouncementConfirmation>(
    `/announcements/${id_announcement}/confirm`,
    { method: "POST", body: { password } },
  );
}
