import type {
  Announcement,
  AnnouncementConfirmation,
  AnnouncementRecipient,
  UUID,
} from "@/types/domain";

// Announcements for the Aula Amarilla demo. Kept close to CONTRACT §16 —
// authorization confirmations live in AnnouncementConfirmation rows below,
// not as a boolean field.

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id_announcement: "ann_paseo",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "authorization",
    scope: "classroom",
    title: "Salida al Parque de las Leyendas",
    content:
      "Miércoles 30 de julio, 8:30 a. m. Requiere autorización firmada. Traer gorro y bloqueador.",
    created_at: "2026-07-17T09:00:00Z",
    updated_at: "2026-07-17T09:00:00Z",
  },
  {
    id_announcement: "ann_reunion_familias",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "informative",
    scope: "classroom",
    title: "Reunión de familias — cierre de bimestre",
    content:
      "Jueves 7 de agosto, 6:00 p. m. en el aula. Se entregará el informe de progreso.",
    created_at: "2026-07-21T09:00:00Z",
    updated_at: "2026-07-21T09:00:00Z",
  },
  {
    id_announcement: "ann_higiene",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "informative",
    scope: "classroom",
    title: "Campaña de lavado de manos",
    content:
      "Esta semana trabajamos hábitos de higiene. Pueden reforzar en casa con la canción que enviamos por el portafolio.",
    created_at: "2026-07-14T09:00:00Z",
    updated_at: "2026-07-14T09:00:00Z",
  },
  {
    id_announcement: "ann_valentina_adaptacion",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "informative",
    scope: "individual",
    title: "Adaptación en la llegada",
    content:
      "Conversamos sobre anticipar la rutina en casa para hacer más suave la despedida de la mañana.",
    created_at: "2026-07-18T09:00:00Z",
    updated_at: "2026-07-18T09:00:00Z",
  },
  {
    id_announcement: "ann_emma_medico",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "informative",
    scope: "individual",
    title: "Certificado médico pendiente",
    content:
      "Recordar enviar el certificado por la alergia registrada en tópico.",
    created_at: "2026-07-15T09:00:00Z",
    updated_at: "2026-07-15T09:00:00Z",
  },
  {
    id_announcement: "ann_gael_reunion",
    id_school: "sch_los_girasoles",
    id_user: "usr_carla_mendoza",
    type: "informative",
    scope: "individual",
    title: "Reunión por inasistencias",
    content: "Coordinar una reunión por las faltas de las últimas semanas.",
    created_at: "2026-07-21T09:00:00Z",
    updated_at: "2026-07-21T09:00:00Z",
  },
];

// Recipient rows (CONTRACT §17). Classroom-scope announcements point at cls_amarilla,
// individual-scope announcements point at the specific student.
export const MOCK_ANNOUNCEMENT_RECIPIENTS: AnnouncementRecipient[] = [
  { id_announcement_recipient: "arc_001", id_announcement: "ann_paseo",             id_student: null,                        id_classroom: "cls_amarilla" },
  { id_announcement_recipient: "arc_002", id_announcement: "ann_reunion_familias",  id_student: null,                        id_classroom: "cls_amarilla" },
  { id_announcement_recipient: "arc_003", id_announcement: "ann_higiene",           id_student: null,                        id_classroom: "cls_amarilla" },
  { id_announcement_recipient: "arc_004", id_announcement: "ann_valentina_adaptacion", id_student: "stu_valentina_torres",  id_classroom: null },
  { id_announcement_recipient: "arc_005", id_announcement: "ann_emma_medico",       id_student: "stu_emma_castillo",         id_classroom: null },
  { id_announcement_recipient: "arc_006", id_announcement: "ann_gael_reunion",      id_student: "stu_gael_huaman",           id_classroom: null },
];

// Authorization confirmations already signed by guardians (CONTRACT §19).
// Encodes which families have signed the Parque de las Leyendas outing.
export const MOCK_ANNOUNCEMENT_CONFIRMATIONS: AnnouncementConfirmation[] = [
  { id_announcement_confirmation: "aco_paseo_mateo",    id_announcement: "ann_paseo", id_user: "usr_carlos_torres" /* placeholder — Mateo's guardian */, confirmed_at: "2026-07-18T09:00:00Z" },
];

export function recipientsFor(id_announcement: UUID): AnnouncementRecipient[] {
  return MOCK_ANNOUNCEMENT_RECIPIENTS.filter(
    (r) => r.id_announcement === id_announcement,
  );
}

export function confirmationsFor(id_announcement: UUID): AnnouncementConfirmation[] {
  return MOCK_ANNOUNCEMENT_CONFIRMATIONS.filter(
    (c) => c.id_announcement === id_announcement,
  );
}
