// Module keys catalog — mirrors docs/MODULES.md.
export const MODULE_KEYS = {
  attendance: "attendance",
  announcements: "announcements",
  studentProfile: "student_profile",
  schoolManagement: "school_management",
  descriptiveConclusionsAi: "descriptive_conclusions_ai",
  competencyProfile: "competency_profile",
  voiceInput: "voice_input",
  aiChatAssistant: "ai_chat_assistant",
  familyPortfolio: "family_portfolio",
  pushNotifications: "push_notifications",
  siagieExport: "siagie_export",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
