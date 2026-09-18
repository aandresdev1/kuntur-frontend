import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { listStudents } from "@/lib/api/students";
import { listUsers, type ApiUser } from "@/lib/api/users";
import {
  listAnnouncements,
  type AnnouncementWithRelations,
} from "@/lib/api/announcements";
import { MOCK_STUDENTS } from "@/data/students";
import { MOCK_USERS, MOCK_USER_ROLES } from "@/data/users";
import { MOCK_ANNOUNCEMENTS } from "@/data/announcements";
import type { Announcement, Student, UUID } from "@/types/domain";

interface TopbarProps {
  compact_logo: boolean;
}

interface SearchResults {
  students: Pick<Student, "id_student" | "full_name">[];
  teachers: Pick<ApiUser, "id_user" | "full_name" | "email">[];
  announcements: Pick<Announcement, "id_announcement" | "title">[];
}

const MAX_PER_GROUP = 4;
const DEBOUNCE_MS = 250;

// Fallback local para sesiones mock (sin token). Se aplica solo si el backend
// responde con error — mantiene el buscador usable en /login-mock.
function mockSearch(
  q: string,
  id_school: UUID | null,
  include_teachers: boolean,
): SearchResults {
  const needle = q.toLowerCase();
  const in_school = <T extends { id_school: string | null }>(row: T) =>
    !id_school || row.id_school === id_school;
  const teacher_ids = new Set(
    MOCK_USER_ROLES.filter((r) => r.role === "teacher").map((r) => r.id_user),
  );
  return {
    students: MOCK_STUDENTS.filter(in_school)
      .filter((s) => s.full_name.toLowerCase().includes(needle))
      .slice(0, MAX_PER_GROUP)
      .map((s) => ({ id_student: s.id_student, full_name: s.full_name })),
    teachers: include_teachers
      ? MOCK_USERS.filter(in_school)
          .filter((u) => teacher_ids.has(u.id_user))
          .filter((u) => u.full_name.toLowerCase().includes(needle))
          .slice(0, MAX_PER_GROUP)
          .map((u) => ({
            id_user: u.id_user,
            full_name: u.full_name,
            email: u.email,
          }))
      : [],
    announcements: MOCK_ANNOUNCEMENTS.filter(in_school)
      .filter((a) => a.title.toLowerCase().includes(needle))
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({ id_announcement: a.id_announcement, title: a.title })),
  };
}

export function Topbar({ compact_logo }: TopbarProps) {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const id_school = session?.id_school ?? null;
  // Docente solo busca alumnos + comunicados — no consulta /users.
  const include_teachers = session?.role !== "teacher";

  // Debounce del input: retrasa la búsqueda hasta que el usuario para de tipear.
  useEffect(() => {
    const trimmed = query.trim();
    const id = window.setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  // Un fetch por cambio de query debounced. Vuelo peticiones anteriores con
  // cancelled para evitar carreras (respuestas fuera de orden).
  useEffect(() => {
    if (!debounced || !session) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listStudents({ id_school, q: debounced }),
      include_teachers
        ? listUsers({ role: "teacher", id_school, q: debounced })
        : Promise.resolve<ApiUser[]>([]),
      listAnnouncements({ q: debounced }),
    ])
      .then(([students, teachers, announcements]) => {
        if (cancelled) return;
        setResults({
          students: students.slice(0, MAX_PER_GROUP).map((s) => ({
            id_student: s.id_student,
            full_name: s.full_name,
          })),
          teachers: teachers.slice(0, MAX_PER_GROUP).map((t) => ({
            id_user: t.id_user,
            full_name: t.full_name,
            email: t.email,
          })),
          announcements: (announcements as AnnouncementWithRelations[])
            .slice(0, MAX_PER_GROUP)
            .map((a) => ({
              id_announcement: a.id_announcement,
              title: a.title,
            })),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResults(mockSearch(debounced, id_school, include_teachers));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, session, id_school, include_teachers]);

  const total_results = results
    ? results.students.length +
      results.teachers.length +
      results.announcements.length
    : 0;

  // Show intermediate "typing" state while the debounce hasn't landed yet.
  const typing = query.trim() !== debounced;

  useEffect(() => {
    if (!open) return;
    const on_mouse = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuery("");
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", on_mouse);
    document.addEventListener("keydown", on_key);
    return () => {
      document.removeEventListener("mousedown", on_mouse);
      document.removeEventListener("keydown", on_key);
    };
  }, [open]);

  if (!session) return null;

  const go = (to: string) => {
    setQuery("");
    setDebounced("");
    setResults(null);
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="topbar">
      {compact_logo ? (
        <div className="topSearch" id="topSearchSlot" ref={searchRef}>
          <svg
            className="topSearchIcon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            placeholder={
              include_teachers
                ? "Buscar alumno, docente o comunicado"
                : "Buscar alumno o comunicado"
            }
            aria-label="Buscar"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button
              className="topSearchClear"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setQuery("");
                setDebounced("");
                setResults(null);
                setOpen(false);
              }}
            >
              ✕
            </button>
          )}
          {open && query && (
            <div className="topResults">
              {typing || loading ? (
                <div className="topResEmpty">Buscando…</div>
              ) : !results || total_results === 0 ? (
                <div className="topResEmpty">
                  Sin resultados para “{query}”
                </div>
              ) : (
                <>
                  {results.students.length > 0 && (
                    <div className="topResGroup">
                      <div className="topResLbl">Alumnos</div>
                      {results.students.map((s) => (
                        <button
                          key={s.id_student}
                          className="topResItem"
                          onClick={() => go(`/students/${s.id_student}`)}
                        >
                          <span className="topResIco">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 4 2 9l10 5 10-5-10-5z" />
                              <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
                            </svg>
                          </span>
                          <span className="topResTxt">
                            <strong>{s.full_name}</strong>
                            <span>Alumno</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.teachers.length > 0 && (
                    <div className="topResGroup">
                      <div className="topResLbl">Docentes</div>
                      {results.teachers.map((t) => (
                        <button
                          key={t.id_user}
                          className="topResItem"
                          onClick={() => go("/teachers")}
                        >
                          <span className="topResIco">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="8" r="3.4" />
                              <path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
                            </svg>
                          </span>
                          <span className="topResTxt">
                            <strong>{t.full_name}</strong>
                            <span>{t.email}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.announcements.length > 0 && (
                    <div className="topResGroup">
                      <div className="topResLbl">Comunicados</div>
                      {results.announcements.map((a) => (
                        <button
                          key={a.id_announcement}
                          className="topResItem"
                          onClick={() => go("/announcements")}
                        >
                          <span className="topResIco">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
                            </svg>
                          </span>
                          <span className="topResTxt">
                            <strong>{a.title}</strong>
                            <span>Comunicado</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="logo">
          <em>Kuntur</em>
          <span className="logoSub">
            {session.role === "super_admin"
              ? "consola de plataforma · superadministración"
              : "seguimiento del alumno · inicial & primaria"}
          </span>
        </div>
      )}
      {session.school_name && (
        <span className="demoTag">{session.school_name}</span>
      )}

      <div className="sesionBox">
        <Avatar full_name={session.full_name} size={34} />
        <div className="sesionTxt">
          <strong>{session.full_name}</strong>
          <span>{session.role_label}</span>
        </div>
        <button
          className="salirBtn"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17l5-5-5-5" />
            <path d="M20 12H9" />
            <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
