import type { UUID } from "@/types/domain";

// Platform admins view — one row per Kuntur-side operator with access to a
// school console. This is a demo shape; the real system pulls the same info
// by joining User + UserRoleAssignment + last-login events.

export interface PlatformAdminRow {
  id_user: UUID;
  full_name: string;
  email: string;
  id_school: UUID | null;
  role_label: string;
  last_access_label: string;
}

export const PLATFORM_ADMINS: PlatformAdminRow[] = [
  { id_user: "usr_patricia_nunez",   full_name: "Patricia Núñez",   email: "direccion@losgirasoles.pe",  id_school: "sch_los_girasoles", role_label: "Dirección",       last_access_label: "Hoy · 08:12" },
  { id_user: "usr_ricardo_vilchez",  full_name: "Ricardo Vílchez",  email: "direccion@sanandres.edu.pe", id_school: "sch_san_andres",    role_label: "Dirección",       last_access_label: "Hoy · 07:40" },
  { id_user: "usr_milagros_caceres", full_name: "Milagros Cáceres", email: "admin@semillitas.pe",         id_school: "sch_semillitas",    role_label: "Dirección",       last_access_label: "Ayer · 18:05" },
  { id_user: "usr_elena_ttito",      full_name: "Elena Ttito",      email: "elena@rayitosdesol.pe",       id_school: "sch_rayitos",       role_label: "Coordinación",    last_access_label: "12 ago · 09:30" },
  { id_user: "usr_jorge_bances",     full_name: "Jorge Bances",     email: "jbances@villamaria.edu.pe",   id_school: "sch_villa_maria",   role_label: "Dirección",       last_access_label: "28 jul · 11:15" },
  { id_user: "usr_carmen_zapata",    full_name: "Carmen Zapata",    email: "czapata@laalborada.edu.pe",   id_school: "sch_alborada",      role_label: "Dirección",       last_access_label: "Hoy · 09:02" },
  { id_user: "usr_andres_cardenas",  full_name: "Andrés Cárdenas",  email: "soporte@kuntur.pe",           id_school: null,                 role_label: "Soporte Kuntur",  last_access_label: "Hoy · 10:20" },
];
