import type {
  User,
  UserRole,
  UserRoleAssignment,
  UUID,
} from "@/types/domain";

// Demo users across all schools + one super_admin. Passwords for the demo
// login are declared in `data/demoAccounts.ts` — kept apart so the User entity
// stays close to the CONTRACT shape.

export const MOCK_USERS: User[] = [
  // Super admin — no school
  {
    id_user: "usr_andres_cardenas",
    id_school: null,
    full_name: "Andrés Cárdenas",
    email: "soporte@kuntur.pe",
    status: "active",
    created_at: "2025-01-15T09:00:00Z",
  },
  // School admins
  {
    id_user: "usr_patricia_nunez",
    id_school: "sch_los_girasoles",
    full_name: "Patricia Núñez",
    email: "direccion@losgirasoles.pe",
    status: "active",
    created_at: "2025-03-01T10:00:00Z",
  },
  {
    id_user: "usr_ricardo_vilchez",
    id_school: "sch_san_andres",
    full_name: "Ricardo Vílchez",
    email: "direccion@sanandres.edu.pe",
    status: "active",
    created_at: "2025-03-05T10:00:00Z",
  },
  {
    id_user: "usr_milagros_caceres",
    id_school: "sch_semillitas",
    full_name: "Milagros Cáceres",
    email: "admin@semillitas.pe",
    status: "active",
    created_at: "2025-04-01T10:00:00Z",
  },
  {
    id_user: "usr_elena_ttito",
    id_school: "sch_rayitos",
    full_name: "Elena Ttito",
    email: "elena@rayitosdesol.pe",
    status: "active",
    created_at: "2025-04-10T10:00:00Z",
  },
  {
    id_user: "usr_jorge_bances",
    id_school: "sch_villa_maria",
    full_name: "Jorge Bances",
    email: "jbances@villamaria.edu.pe",
    status: "active",
    created_at: "2025-05-01T10:00:00Z",
  },
  {
    id_user: "usr_carmen_zapata",
    id_school: "sch_alborada",
    full_name: "Carmen Zapata",
    email: "czapata@laalborada.edu.pe",
    status: "active",
    created_at: "2025-05-10T10:00:00Z",
  },
  // Teachers in Los Girasoles
  {
    id_user: "usr_carla_mendoza",
    id_school: "sch_los_girasoles",
    full_name: "Carla Mendoza",
    email: "carla.mendoza@losgirasoles.pe",
    status: "active",
    created_at: "2025-03-15T10:00:00Z",
  },
  {
    id_user: "usr_rosa_ttito",
    id_school: "sch_los_girasoles",
    full_name: "Rosa Ttito",
    email: "rosa.ttito@losgirasoles.pe",
    status: "active",
    created_at: "2025-03-15T10:00:00Z",
  },
  {
    id_user: "usr_diego_salas",
    id_school: "sch_los_girasoles",
    full_name: "Diego Salas",
    email: "diego.salas@losgirasoles.pe",
    status: "active",
    created_at: "2025-03-15T10:00:00Z",
  },
  {
    id_user: "usr_fernanda_leon",
    id_school: "sch_los_girasoles",
    full_name: "Fernanda León",
    email: "fernanda.leon@losgirasoles.pe",
    status: "active",
    created_at: "2025-03-15T10:00:00Z",
  },
  // Guardian (demo family)
  {
    id_user: "usr_carlos_torres",
    id_school: "sch_los_girasoles",
    full_name: "Carlos Torres",
    email: "carlos.torres@gmail.com",
    status: "active",
    created_at: "2025-04-01T10:00:00Z",
  },
];

export const MOCK_USER_ROLES: UserRoleAssignment[] = [
  { id_user_role_assignment: "ura_001", id_user: "usr_andres_cardenas", role: "super_admin" },
  { id_user_role_assignment: "ura_002", id_user: "usr_patricia_nunez", role: "school_admin" },
  { id_user_role_assignment: "ura_003", id_user: "usr_ricardo_vilchez", role: "school_admin" },
  { id_user_role_assignment: "ura_004", id_user: "usr_milagros_caceres", role: "school_admin" },
  { id_user_role_assignment: "ura_005", id_user: "usr_elena_ttito", role: "school_admin" },
  { id_user_role_assignment: "ura_006", id_user: "usr_jorge_bances", role: "school_admin" },
  { id_user_role_assignment: "ura_007", id_user: "usr_carmen_zapata", role: "school_admin" },
  { id_user_role_assignment: "ura_008", id_user: "usr_carla_mendoza", role: "teacher" },
  { id_user_role_assignment: "ura_009", id_user: "usr_rosa_ttito", role: "teacher" },
  { id_user_role_assignment: "ura_010", id_user: "usr_diego_salas", role: "teacher" },
  { id_user_role_assignment: "ura_011", id_user: "usr_fernanda_leon", role: "teacher" },
  { id_user_role_assignment: "ura_012", id_user: "usr_carlos_torres", role: "guardian" },
];

const USERS_BY_ID: Record<UUID, User> = Object.fromEntries(
  MOCK_USERS.map((u) => [u.id_user, u]),
);

export function findUserById(id_user: UUID): User | null {
  return USERS_BY_ID[id_user] ?? null;
}

export function rolesForUser(id_user: UUID): UserRole[] {
  return MOCK_USER_ROLES.filter((r) => r.id_user === id_user).map((r) => r.role);
}
