import { NavLink, useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { MOCK_SCHOOLS, SCHOOL_PRESENTATION } from "@/data/schools";
import {
  MOCK_CLASSROOMS,
  classroomsForTeacher,
} from "@/data/classrooms";
import { studentsInClassroom } from "@/data/students";
import { TODAY_ATTENDANCE_BY_STUDENT } from "@/data/attendance";
import type { UserRole } from "@/types/domain";

const DASHBOARD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const HOME_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h14V9" />
  </svg>
);
const CALENDAR_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M8 3v4" /><path d="M16 3v4" />
  </svg>
);
const USERS_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><circle cx="18" cy="9" r="3" /><path d="M16 21c0-3 2-4.5 4-4.5s2 .5 2 1.5" />
  </svg>
);
const CHAT_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
  </svg>
);
const CLASS_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="15" rx="2" /><path d="M3 9h18" /><path d="M8 14h4" />
  </svg>
);
const TEACHER_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);
const SCHOOL_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M10 21v-6h4v6" />
  </svg>
);
const SHIELD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />
  </svg>
);
const BOOK_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" /><path d="M4 4v12" />
  </svg>
);
const SUBJECTS_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4z" /><path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" /><path d="M9 8h7" /><path d="M9 12h7" /><path d="M9 16h4" />
  </svg>
);

// Menus mirror the reference App.jsx L1371-1383 order and labels exactly.
const MENU_BY_ROLE: Record<UserRole, NavItem[]> = {
  school_admin: [
    { to: "/overview",      label: "Dashboard",   icon: HOME_ICON },
    { to: "/classrooms",    label: "Aulas",       icon: CLASS_ICON },
    { to: "/announcements", label: "Comunicados", icon: CHAT_ICON },
    { to: "/students",      label: "Alumnos",     icon: USERS_ICON },
    { to: "/teachers",      label: "Docentes",    icon: TEACHER_ICON },
    { to: "/subjects",      label: "Materias",    icon: SUBJECTS_ICON },
  ],
  teacher: [
    { to: "/attendance",    label: "Asistencia",  icon: CALENDAR_ICON },
    { to: "/students",      label: "Alumnos",     icon: USERS_ICON },
    { to: "/announcements", label: "Comunicados", icon: CHAT_ICON },
  ],
  guardian: [
    { to: "/portfolio",     label: "Portafolio",  icon: BOOK_ICON },
  ],
  super_admin: [
    { to: "/panel",           label: "Panel",           icon: DASHBOARD_ICON },
    { to: "/schools",         label: "Colegios",        icon: SCHOOL_ICON },
    { to: "/platform-admins", label: "Administradores", icon: SHIELD_ICON },
  ],
};

// Matches the sidenavPie footer text in the reference (App.jsx L1418).
const FOOTER_DATE_LABEL = "Hoy · viernes 15 de agosto";

// Hardcoded to match reference sidenav footer (App.jsx L1385).
const CLASSROOMS_WITH_ATTENDANCE = 3;

function firstToken(text: string): string {
  const comma = text.indexOf(",");
  return comma >= 0 ? text.slice(0, comma).trim() : text.trim();
}

export function Sidenav() {
  const { session } = useSession();
  const navigate = useNavigate();
  if (!session) return null;

  const items = MENU_BY_ROLE[session.role];

  const school = session.id_school
    ? MOCK_SCHOOLS.find((s) => s.id_school === session.id_school) ?? null
    : null;
  const school_presentation = session.id_school
    ? SCHOOL_PRESENTATION[session.id_school] ?? null
    : null;

  // Teacher-only: derive the assigned classroom for the subtitle + footer roster.
  const teacher_classroom_id =
    session.role === "teacher" ? classroomsForTeacher(session.id_user)[0] ?? null : null;
  const teacher_classroom = teacher_classroom_id
    ? MOCK_CLASSROOMS.find((c) => c.id_classroom === teacher_classroom_id) ?? null
    : null;

  // Subtitle mirrors reference L1397: "Docente · {aula}" or "Inicial y Primaria · {city}".
  let subtitle: string | null = null;
  if (session.role === "teacher" && teacher_classroom) {
    subtitle = `Docente · ${teacher_classroom.name}`;
  } else if (session.role === "school_admin" && school_presentation) {
    subtitle = `Inicial y Primaria · ${firstToken(school_presentation.city)}`;
  } else if (session.role === "super_admin") {
    subtitle = `Superadministración · ${MOCK_SCHOOLS.length} colegios`;
  }

  // Footer per role (reference L1417-1429 + L4302-4315 for superadmin).
  const shows_footer =
    session.role === "school_admin" ||
    session.role === "teacher" ||
    session.role === "super_admin";
  let footer_date_label = FOOTER_DATE_LABEL;
  let footer_title = "Asistencia registrada";
  let footer_progress = 0;
  let footer_sub = "";
  let footer_cta_label = "";
  let footer_cta_to = "";
  if (shows_footer) {
    if (session.role === "teacher" && teacher_classroom_id) {
      const roster = studentsInClassroom(teacher_classroom_id);
      const marked = roster.filter((s) => {
        const st = TODAY_ATTENDANCE_BY_STUDENT[s.id_student];
        return st === "present" || st === "late";
      }).length;
      footer_progress = roster.length > 0 ? marked / roster.length : 0;
      footer_sub = `${marked} de ${roster.length} alumnos`;
      footer_cta_label = "Ir a asistencia";
      footer_cta_to = "/attendance";
    } else if (session.role === "super_admin") {
      const total = MOCK_SCHOOLS.length;
      const active = MOCK_SCHOOLS.filter((s) => s.status === "active").length;
      footer_date_label = "Hoy · lunes 17 de agosto";
      footer_title = "Licencias vigentes";
      footer_progress = total > 0 ? active / total : 0;
      footer_sub = `${active} de ${total} colegios activos`;
      footer_cta_label = "Ver licencias por vencer";
      footer_cta_to = "/schools";
    } else {
      const total_classrooms = MOCK_CLASSROOMS.filter(
        (c) => !session.id_school || c.id_school === session.id_school,
      ).length || MOCK_CLASSROOMS.length;
      footer_progress =
        total_classrooms > 0 ? CLASSROOMS_WITH_ATTENDANCE / total_classrooms : 0;
      footer_sub = `${CLASSROOMS_WITH_ATTENDANCE} de ${total_classrooms} aulas`;
      footer_cta_label = "Ver aulas pendientes";
      footer_cta_to = "/classrooms";
    }
  }

  const menu_aria_label =
    session.role === "teacher"
      ? "Menú del docente"
      : session.role === "super_admin"
        ? "Menú de superadministración"
        : "Menú de dirección";

  const header_strong =
    session.role === "super_admin" ? "Consola de plataforma" : school?.name;

  return (
    <aside
      className="sidenav"
      aria-label={
        session.role === "school_admin" ||
        session.role === "teacher" ||
        session.role === "super_admin"
          ? menu_aria_label
          : undefined
      }
    >
      <div className="sidenavLogo">
        <em>Kuntur</em>
      </div>

      {header_strong && (
        <div className="sidenavCole">
          <strong>{header_strong}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}

      <nav className="sidenavMenu" aria-label="Navegación principal">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              "sideItem" + (isActive ? " sideItemOn" : "")
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {shows_footer && (
        <div className="sidenavPie">
          <div className="sidenavPieDia">{footer_date_label}</div>
          <div className="sidenavPieTit">{footer_title}</div>
          <div className="sidenavPieBar">
            <span style={{ width: `${Math.round(footer_progress * 100)}%` }} />
          </div>
          <div className="sidenavPieSub">{footer_sub}</div>
          <button
            className="sidenavPieBtn"
            onClick={() => navigate(footer_cta_to)}
          >
            {footer_cta_label}
          </button>
        </div>
      )}
    </aside>
  );
}
