import type { Session, UserRole, UUID } from "@/types/domain";

// Demo credentials. Real system authenticates against the backend and receives
// a JWT — this file only exists to make the demo login page work end-to-end.

interface DemoAccount {
  email: string;
  password: string;
  id_user: UUID;
  id_school: UUID | null;
  school_name: string | null;
  full_name: string;
  role: UserRole;
  role_label: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "direccion@losgirasoles.pe",
    password: "demo1234",
    id_user: "usr_patricia_nunez",
    id_school: "sch_los_girasoles",
    school_name: "Nido Los Girasoles",
    full_name: "Patricia Núñez",
    role: "school_admin",
    role_label: "Dirección · Nido Los Girasoles",
  },
  {
    email: "carla.mendoza@losgirasoles.pe",
    password: "demo1234",
    id_user: "usr_carla_mendoza",
    id_school: "sch_los_girasoles",
    school_name: "Nido Los Girasoles",
    full_name: "Carla Mendoza",
    role: "teacher",
    role_label: "Docente · Aula Amarilla",
  },
  {
    email: "soporte@kuntur.pe",
    password: "demo1234",
    id_user: "usr_andres_cardenas",
    id_school: null,
    school_name: null,
    full_name: "Andrés Cárdenas",
    role: "super_admin",
    role_label: "Superadministrador · Plataforma Kuntur",
  },
  {
    email: "carlos.torres@gmail.com",
    password: "demo1234",
    id_user: "usr_carlos_torres",
    id_school: "sch_los_girasoles",
    school_name: "Nido Los Girasoles",
    full_name: "Carlos Torres",
    role: "guardian",
    role_label: "Apoderado de Valentina Torres",
  },
];

export function authenticate(
  email: string,
  password: string,
): Session | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!account) return null;
  return {
    id_user: account.id_user,
    id_school: account.id_school,
    school_name: account.school_name,
    full_name: account.full_name,
    role: account.role,
    role_label: account.role_label,
  };
}
