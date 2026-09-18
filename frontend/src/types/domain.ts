// Domain types derived from docs/CONTRACT.md.
// Field names follow the contract exactly (id_entity, snake_case for API-facing fields).
// UI-only mock fields (denormalized helpers used by the demo) are marked explicitly.

export type UUID = string;
export type ISODate = string;
export type ISOTimestamp = string;

// § 0. System enums
export type UserRole = "super_admin" | "school_admin" | "teacher" | "guardian";
export type StudentStatus = "active" | "withdrawn";
export type AttendanceStatus = "present" | "late" | "absent";
export type ObservationSource = "text" | "voice";
export type AnnouncementType = "informative" | "authorization";
export type AnnouncementScope =
  | "individual"
  | "classroom"
  | "multi_classroom"
  | "school_wide";
export type ClassroomTeacherRole = "lead" | "subject_teacher" | "assistant";
export type ClassroomLevel =
  | "initial_3"
  | "initial_4"
  | "initial_5"
  | "primary_1"
  | "primary_2"
  | "primary_3"
  | "primary_4"
  | "primary_5"
  | "primary_6"
  | "secondary_1"
  | "secondary_2"
  | "secondary_3"
  | "secondary_4"
  | "secondary_5";
export type SchoolStatus = "active" | "inactive";
export type UserStatus = "active" | "inactive";

// § 2. School
export interface School {
  id_school: UUID;
  name: string;
  status: SchoolStatus;
  created_at: ISOTimestamp;
}

// § 3. SchoolModule
export interface SchoolModule {
  id_school_module: UUID;
  id_school: UUID;
  module_key: string;
  enabled: boolean;
}

// § 4. User
export interface User {
  id_user: UUID;
  id_school: UUID | null;
  full_name: string;
  email: string;
  status: UserStatus;
  created_at: ISOTimestamp;
}

// § 5. UserRoleAssignment
export interface UserRoleAssignment {
  id_user_role_assignment: UUID;
  id_user: UUID;
  role: UserRole;
}

// § 6. Classroom
export interface Classroom {
  id_classroom: UUID;
  id_school: UUID;
  name: string;
  level: ClassroomLevel | null;
}

// § 7. ClassroomTeacher
export interface ClassroomTeacher {
  id_classroom_teacher: UUID;
  id_classroom: UUID;
  id_user: UUID;
  id_subject: UUID | null;
  role: ClassroomTeacherRole;
}

// § 8. Subject
export interface Subject {
  id_subject: UUID;
  id_school: UUID;
  name: string;
  status: "active" | "inactive";
}

// § 9. Student
export interface Student {
  id_student: UUID;
  id_school: UUID;
  id_classroom: UUID | null;
  full_name: string;
  status: StudentStatus;
  birth_date: ISODate;
  enrolled_at: ISODate;
  guardian_count?: number;
}

// § 10. StudentGuardian
export interface StudentGuardian {
  id_student_guardian: UUID;
  id_student: UUID;
  id_user: UUID;
}

// § 11. Attendance
export interface Attendance {
  id_attendance: UUID;
  id_student: UUID;
  date: ISODate;
  status: AttendanceStatus;
  created_by: UUID;
  updated_at: ISOTimestamp;
}

// § 12. Competency
export interface Competency {
  id_competency: UUID;
  name: string;
}

// § 13. Observation
export interface Observation {
  id_observation: UUID;
  id_student: UUID;
  id_classroom: UUID;
  id_subject: UUID | null;
  id_competency: UUID;
  id_user: UUID;
  content: string;
  source: ObservationSource;
  created_at: ISOTimestamp;
}

// § 14. DescriptiveConclusion
export interface DescriptiveConclusion {
  id_descriptive_conclusion: UUID;
  id_student: UUID;
  content: string;
  generated_at: ISOTimestamp;
  confirmed_by: UUID;
  confirmed_at: ISOTimestamp;
}

// § 15. CompetencyProfile (derived)
export interface CompetencyProfile {
  id_student: UUID;
  competency_labels: string[];
  attendance_labels: string[];
  last_calculated_at: ISOTimestamp;
}

// § 16. Announcement
export interface Announcement {
  id_announcement: UUID;
  id_school: UUID;
  id_user: UUID;
  type: AnnouncementType;
  scope: AnnouncementScope;
  title: string;
  content: string;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

// § 17. AnnouncementRecipient
export interface AnnouncementRecipient {
  id_announcement_recipient: UUID;
  id_announcement: UUID;
  id_student: UUID | null;
  id_classroom: UUID | null;
}

// § 18. AnnouncementRead
export interface AnnouncementRead {
  id_announcement_read: UUID;
  id_announcement: UUID;
  id_user: UUID;
  read_at: ISOTimestamp;
}

// § 19. AnnouncementConfirmation
export interface AnnouncementConfirmation {
  id_announcement_confirmation: UUID;
  id_announcement: UUID;
  id_user: UUID;
  confirmed_at: ISOTimestamp;
}

// § 20. AnnouncementAttachment
export interface AnnouncementAttachment {
  id_announcement_attachment: UUID;
  id_announcement: UUID;
  file_url: string;
  file_type: "image" | "video";
  file_name: string;
  file_size_bytes: number;
  duration_seconds: number | null;
  uploaded_by: UUID;
  created_at: ISOTimestamp;
}

// § 21. Notification
export interface Notification {
  id_notification: UUID;
  id_user: UUID;
  event_type: string;
  sent_at: ISOTimestamp;
}

// Session shape used by the frontend after login. Not in CONTRACT — it is the
// resolved JWT payload the client keeps in memory.
export interface Session {
  id_user: UUID;
  id_school: UUID | null;
  school_name: string | null;
  full_name: string;
  role: UserRole;
  role_label: string;
}
