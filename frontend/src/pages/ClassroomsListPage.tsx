import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { MockBadge } from "@/components/MockBadge";
import { Pagination } from "@/components/Pagination";
import { useSession } from "@/contexts/SessionContext";
import { ImportPopup } from "@/features/import/ImportPopup";
import type { ImportRow } from "@/data/importDemo";
import { ApiError } from "@/lib/api";
import {
  assignTeacher,
  commitClassroomsFile,
  createClassroom,
  downloadClassroomsTemplate,
  getClassroom,
  listClassrooms,
  previewClassroomsFile,
  unassignTeacher,
  updateClassroom,
  type ClassroomWithLinks,
} from "@/lib/api/classrooms";
import { listStudents } from "@/lib/api/students";
import {
  attendanceForClassroom,
  type AttendanceForClassroomRow,
} from "@/lib/api/attendance";
import { listUsers, type ApiUser } from "@/lib/api/users";
import type {
  AttendanceStatus,
  ClassroomLevel,
  Student,
  UUID,
} from "@/types/domain";

const LEVEL_OPTIONS: { value: ClassroomLevel; label: string }[] = [
  { value: "initial_3", label: "Inicial · 3 años" },
  { value: "initial_4", label: "Inicial · 4 años" },
  { value: "initial_5", label: "Inicial · 5 años" },
  { value: "primary_1", label: "Primaria · 1° grado" },
  { value: "primary_2", label: "Primaria · 2° grado" },
  { value: "primary_3", label: "Primaria · 3° grado" },
  { value: "primary_4", label: "Primaria · 4° grado" },
  { value: "primary_5", label: "Primaria · 5° grado" },
  { value: "primary_6", label: "Primaria · 6° grado" },
  { value: "secondary_1", label: "Secundaria · 1° año" },
  { value: "secondary_2", label: "Secundaria · 2° año" },
  { value: "secondary_3", label: "Secundaria · 3° año" },
  { value: "secondary_4", label: "Secundaria · 4° año" },
  { value: "secondary_5", label: "Secundaria · 5° año" },
];
const LEVEL_LABEL: Record<ClassroomLevel, string> = Object.fromEntries(
  LEVEL_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ClassroomLevel, string>;
const LEVEL_UNSET_LABEL = "Sin nivel";

const UNASSIGNED_LABEL = "Sin asignar";

interface AulaRow {
  id_classroom: UUID;
  name: string;
  level: ClassroomLevel | null;
  student_count: number;
  lead_id_user: UUID | null;
  lead_full_name: string; // UNASSIGNED_LABEL when there's no lead
  lead_id_ct: UUID | null;
}

interface AulaFilters {
  level: ClassroomLevel | "";
  docente: string;
  alumnosMin: string;
}

interface AulaPopupState {
  id_classroom?: UUID;
  name: string;
  level: ClassroomLevel | ""; // "" = sin definir (solo permitido en edición de aulas heredadas)
  lead_id_user: UUID | ""; // "" means unassigned
}

const EMPTY_FILTERS: AulaFilters = {
  level: "",
  docente: "",
  alumnosMin: "",
};

const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);
const FILTER_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" />
  </svg>
);
const IMPORT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 19h16" />
  </svg>
);
const FICHA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" />
  </svg>
);
const CHAT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
  </svg>
);

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Merge classroom detail (teacher_links) with student counts from listStudents.
async function loadRows(id_school: UUID | null): Promise<AulaRow[]> {
  const [list, students] = await Promise.all([
    listClassrooms({ id_school }),
    listStudents({ id_school }),
  ]);
  const details = await Promise.all(
    list.map((c) =>
      getClassroom(c.id_classroom, { id_school: id_school ?? undefined }),
    ),
  );
  const countByClassroom = new Map<UUID, number>();
  for (const s of students) {
    if (!s.id_classroom) continue;
    countByClassroom.set(
      s.id_classroom,
      (countByClassroom.get(s.id_classroom) ?? 0) + 1,
    );
  }
  return details.map((c) => toRow(c, countByClassroom.get(c.id_classroom) ?? 0));
}

function toRow(c: ClassroomWithLinks, student_count: number): AulaRow {
  const lead = c.teacher_links.find((l) => l.role === "lead");
  return {
    id_classroom: c.id_classroom,
    name: c.name,
    level: c.level ?? null,
    student_count,
    lead_id_user: lead?.id_user ?? null,
    lead_full_name: lead?.user.full_name ?? UNASSIGNED_LABEL,
    lead_id_ct: lead?.id_classroom_teacher ?? null,
  };
}

// Detail-view row uniting student + today's attendance.
interface RosterRow {
  student: Student;
  today_status: AttendanceStatus | null;
}

export default function ClassroomsListPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "teacher") return <Navigate to="/attendance" replace />;

  const id_school = session.id_school;

  const [aulas, setAulas] = useState<AulaRow[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<ApiUser[]>([]);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");

  const [selectedAulaId, setSelectedAulaId] = useState<UUID | null>(null);

  // List-view search + filters
  const [buscador, setBuscador] = useState("");
  const [buscadorDraft, setBuscadorDraft] = useState("");
  const [filtros, setFiltros] = useState<AulaFilters>(EMPTY_FILTERS);
  const [filtrosDraft, setFiltrosDraft] = useState<AulaFilters>(EMPTY_FILTERS);
  const [filtroPanel, setFiltroPanel] = useState(false);

  // Detail-view alumno search
  const [alumnoFiltro, setAlumnoFiltro] = useState("");
  const [alumnoFiltroDraft, setAlumnoFiltroDraft] = useState("");
  const [rosterStatus, setRosterStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [rosterError, setRosterError] = useState("");
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);

  const [aulaPopup, setAulaPopup] = useState<AulaPopupState | null>(null);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    Promise.all([
      loadRows(id_school),
      listUsers({ role: "teacher", id_school }),
    ])
      .then(([rows, teachers]) => {
        if (cancelled) return;
        setAulas(rows);
        setTeacherOptions(teachers);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar las aulas.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_school]);

  // Load roster + today's attendance when entering the detail view.
  useEffect(() => {
    if (!selectedAulaId) {
      setRosterRows([]);
      setRosterStatus("idle");
      return;
    }
    let cancelled = false;
    setRosterStatus("loading");
    setRosterError("");
    Promise.all([
      listStudents({ id_school, id_classroom: selectedAulaId }),
      attendanceForClassroom(selectedAulaId, today()),
    ])
      .then(([students, attendance]) => {
        if (cancelled) return;
        const byStudent = new Map<UUID, AttendanceForClassroomRow>();
        for (const a of attendance) byStudent.set(a.id_student, a);
        setRosterRows(
          students.map((s) => ({
            student: s,
            today_status: byStudent.get(s.id_student)?.status ?? null,
          })),
        );
        setRosterStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setRosterError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el aula.",
        );
        setRosterStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAulaId, id_school]);

  const activeFilterCount = Object.values(filtros).filter(Boolean).length;

  // ─── DETAIL VIEW ───────────────────────────────────────────────────────
  const selectedAula = selectedAulaId
    ? aulas.find((a) => a.id_classroom === selectedAulaId) ?? null
    : null;

  if (selectedAula) {
    const q = alumnoFiltro.trim().toLowerCase();
    const roster = rosterRows.filter(
      (r) => !q || r.student.full_name.toLowerCase().includes(q),
    );

    const closeDetail = () => {
      setSelectedAulaId(null);
      setAlumnoFiltro("");
      setAlumnoFiltroDraft("");
      setRosterPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(roster.length / rosterPageSize));
    const currentPage = Math.min(rosterPage, totalPages);
    const pageRows = roster.slice(
      (currentPage - 1) * rosterPageSize,
      currentPage * rosterPageSize,
    );

    return (
      <div>
        <div className="pageTitle">{selectedAula.name}.</div>
        <div className="pageSub">
          {selectedAula.level
            ? LEVEL_LABEL[selectedAula.level]
            : LEVEL_UNSET_LABEL}
          {" · "}
          {rosterRows.length} alumnos · Docente: {selectedAula.lead_full_name}
        </div>

        <div className="cuadHeader cuadHeaderTools">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <div className="searchBox searchBoxWide">
              <input
                className="input"
                placeholder="Filtrar esta lista…"
                value={alumnoFiltroDraft}
                onChange={(e) => setAlumnoFiltroDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setAlumnoFiltro(alumnoFiltroDraft);
                }}
              />
              <button
                className="searchBoxBtn"
                title="Buscar"
                aria-label="Buscar"
                onClick={() => setAlumnoFiltro(alumnoFiltroDraft)}
              >
                {SEARCH_ICON}
              </button>
            </div>
            <button className="btnGhost btnLbl" onClick={closeDetail}>
              ← Volver a aulas
            </button>
          </div>
        </div>

        {rosterStatus === "loading" && (
          <Card className="cardFlush">
            <div className="histEmpty">Cargando alumnos…</div>
          </Card>
        )}

        {rosterStatus === "error" && (
          <Card className="cardFlush">
            <div className="loginError" role="alert">
              {rosterError}
            </div>
          </Card>
        )}

        {rosterStatus === "ready" && (
          <Card className="cardFlush">
            {roster.length === 0 ? (
              <div className="histEmpty">
                {q
                  ? `Ningún alumno coincide con "${alumnoFiltro}".`
                  : "Todavía no hay alumnos registrados en esta aula."}
              </div>
            ) : (
              <div className="tableWrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>
                        Apoderado
                        <MockBadge />
                      </th>
                      <th>Asistencia hoy</th>
                      <th>
                        Obs.
                        <MockBadge />
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => {
                      const st = r.today_status;
                      return (
                        <tr key={r.student.id_student}>
                          <td>
                            <div className="tdName">
                              <Avatar full_name={r.student.full_name} size={28} />
                              {r.student.full_name}
                            </div>
                          </td>
                          <td className="tdMuted">—</td>
                          <td>
                            {st ? (
                              <Chip
                                tone={
                                  st === "present"
                                    ? "green"
                                    : st === "late"
                                      ? "amber"
                                      : "red"
                                }
                              >
                                {st === "present"
                                  ? "Presente"
                                  : st === "late"
                                    ? "Tarde"
                                    : "Falta"}
                              </Chip>
                            ) : (
                              <span className="tdMuted">Sin marcar</span>
                            )}
                          </td>
                          <td>0</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                              <button
                                className="btnGhost btnIcon"
                                title="Ficha del alumno"
                                aria-label={"Ficha de " + r.student.full_name}
                                onClick={() =>
                                  navigate(`/students/${r.student.id_student}`)
                                }
                              >
                                {FICHA_ICON}
                              </button>
                              <button
                                className="btnGhost btnIcon"
                                title="Comunicados"
                                aria-label={"Comunicados de " + r.student.full_name}
                                onClick={() =>
                                  navigate(
                                    `/announcements?student=${r.student.id_student}&from=aulas`,
                                  )
                                }
                              >
                                {CHAT_ICON}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  page={currentPage}
                  setPage={setRosterPage}
                  totalItems={roster.length}
                  pageSize={rosterPageSize}
                  setPageSize={setRosterPageSize}
                />
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────────────
  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Aulas.</div>
        <div className="pageSub">Cargando aulas…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Aulas.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  const qAula = buscador.trim().toLowerCase();
  const filteredAulas = aulas.filter((a) => {
    if (
      qAula &&
      !(
        a.name.toLowerCase().includes(qAula) ||
        a.lead_full_name.toLowerCase().includes(qAula)
      )
    ) {
      return false;
    }
    if (filtros.level && a.level !== filtros.level) return false;
    if (filtros.docente && a.lead_full_name !== filtros.docente) return false;
    if (filtros.alumnosMin && a.student_count < Number(filtros.alumnosMin))
      return false;
    return true;
  });

  const unassigned_count = aulas.filter((a) => !a.lead_id_user).length;

  const listTotalPages = Math.max(1, Math.ceil(filteredAulas.length / listPageSize));
  const listCurrentPage = Math.min(listPage, listTotalPages);
  const pageAulas = filteredAulas.slice(
    (listCurrentPage - 1) * listPageSize,
    listCurrentPage * listPageSize,
  );

  const openNew = () => {
    setAulaPopup({
      name: "",
      level: "",
      lead_id_user: "",
    });
    setPopupError("");
  };

  const openEdit = (a: AulaRow) => {
    setAulaPopup({
      id_classroom: a.id_classroom,
      name: a.name,
      level: a.level ?? "",
      lead_id_user: a.lead_id_user ?? "",
    });
    setPopupError("");
  };

  // Reconcile lead assignment: if selection changed, unassign old and assign
  // new. Any assign/unassign error is surfaced but we don't roll back the name
  // change (already persisted).
  const reconcileLead = async (
    id_classroom: UUID,
    previous: AulaRow | null,
    next_id_user: UUID | "",
  ) => {
    const prev_id_user = previous?.lead_id_user ?? null;
    const prev_id_ct = previous?.lead_id_ct ?? null;
    if ((next_id_user || null) === (prev_id_user || null)) return;
    if (prev_id_ct) {
      await unassignTeacher(id_classroom, prev_id_ct, { id_school });
    }
    if (next_id_user) {
      await assignTeacher(
        id_classroom,
        { id_user: next_id_user, role: "lead" },
        { id_school },
      );
    }
  };

  const refreshRow = async (id_classroom: UUID): Promise<AulaRow> => {
    const [detail, students] = await Promise.all([
      getClassroom(id_classroom, { id_school: id_school ?? undefined }),
      listStudents({ id_school, id_classroom }),
    ]);
    return toRow(detail, students.length);
  };

  const saveAula = async () => {
    if (!aulaPopup || popupSaving) return;
    const name = aulaPopup.name.trim();
    if (!name) {
      setPopupError("El nombre del aula es obligatorio.");
      return;
    }
    // Nivel obligatorio al crear. Al editar, si el aula heredada no tenía
    // nivel se permite dejarlo vacío para no bloquear operaciones sobre
    // aulas viejas; una vez seteado, no volvemos a permitir vaciarlo.
    const previousLevel = aulaPopup.id_classroom
      ? aulas.find((a) => a.id_classroom === aulaPopup.id_classroom)?.level ??
        null
      : null;
    if (!aulaPopup.level) {
      if (!aulaPopup.id_classroom) {
        setPopupError("Selecciona el nivel del aula.");
        return;
      }
      if (previousLevel) {
        setPopupError("El nivel del aula no puede quedar vacío.");
        return;
      }
    }
    setPopupSaving(true);
    setPopupError("");
    try {
      if (aulaPopup.id_classroom) {
        const previous =
          aulas.find((a) => a.id_classroom === aulaPopup.id_classroom) ?? null;
        await updateClassroom(
          aulaPopup.id_classroom,
          {
            name,
            ...(aulaPopup.level ? { level: aulaPopup.level } : {}),
          },
          { id_school },
        );
        await reconcileLead(
          aulaPopup.id_classroom,
          previous,
          aulaPopup.lead_id_user,
        );
        const fresh = await refreshRow(aulaPopup.id_classroom);
        setAulas((prev) =>
          prev.map((a) =>
            a.id_classroom === fresh.id_classroom ? fresh : a,
          ),
        );
      } else {
        const created = await createClassroom({
          name,
          level: aulaPopup.level as ClassroomLevel,
          id_school,
        });
        if (aulaPopup.lead_id_user) {
          await assignTeacher(
            created.id_classroom,
            { id_user: aulaPopup.lead_id_user, role: "lead" },
            { id_school },
          );
        }
        const fresh = await refreshRow(created.id_classroom);
        setAulas((prev) => [...prev, fresh]);
      }
      setAulaPopup(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el aula.",
      );
    } finally {
      setPopupSaving(false);
    }
  };

  const reloadAulas = async () => {
    try {
      const rows = await loadRows(id_school);
      setAulas(rows);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron refrescar las aulas.",
      );
      setLoadStatus("error");
    }
  };

  const previewClassrooms = async (file: File): Promise<ImportRow[]> => {
    const summary = await previewClassroomsFile(file, { id_school });
    return summary.rows;
  };

  const commitClassrooms = async (file: File): Promise<ImportRow[]> => {
    const summary = await commitClassroomsFile(file, { id_school });
    await reloadAulas();
    return summary.rows;
  };

  const onImportConfirmed = () => {
    // Refetch already happened inside commitClassrooms; nothing else to do.
  };

  return (
    <div>
      <div className="pageTitle">Aulas.</div>
      <div className="pageSub">
        {aulas.length} aulas · {unassigned_count} sin docente asignado
      </div>

      <div className="cuadHeader cuadHeaderTools">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
          <div className="searchBox searchBoxWide">
            <input
              className="input"
              placeholder="Filtrar esta lista…"
              value={buscadorDraft}
              onChange={(e) => setBuscadorDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setBuscador(buscadorDraft);
              }}
            />
            <button
              className="searchBoxBtn"
              title="Buscar"
              aria-label="Buscar"
              onClick={() => setBuscador(buscadorDraft)}
            >
              {SEARCH_ICON}
            </button>
          </div>
          <button
            className={"btnGhost btnLbl" + (activeFilterCount > 0 ? " filtroBtnOn" : "")}
            title="Filtros"
            aria-label="Filtros"
            onClick={() => {
              setFiltrosDraft(filtros);
              setFiltroPanel(true);
            }}
          >
            {FILTER_ICON}
            Filtrar
            {activeFilterCount > 0 && (
              <span className="filtroBadge">{activeFilterCount}</span>
            )}
          </button>
          <button
            className="btnGhost btnLbl"
            title="Importar aulas desde Excel"
            aria-label="Importar aulas"
            onClick={() => setImportOpen(true)}
          >
            {IMPORT_ICON}
            Importar
          </button>
          <button className="btn" onClick={openNew}>
            + Nueva aula
          </button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="chipsBar">
          {filtros.level && (
            <span className="filtroChip">
              Nivel: {LEVEL_LABEL[filtros.level]}{" "}
              <button onClick={() => setFiltros({ ...filtros, level: "" })}>✕</button>
            </span>
          )}
          {filtros.docente && (
            <span className="filtroChip">
              Docente: {filtros.docente}{" "}
              <button onClick={() => setFiltros({ ...filtros, docente: "" })}>✕</button>
            </span>
          )}
          {filtros.alumnosMin && (
            <span className="filtroChip">
              Alumnos ≥ {filtros.alumnosMin}{" "}
              <button onClick={() => setFiltros({ ...filtros, alumnosMin: "" })}>✕</button>
            </span>
          )}
          <button
            className="filtroClearAll"
            onClick={() => setFiltros(EMPTY_FILTERS)}
          >
            Limpiar todo
          </button>
        </div>
      )}

      <Card className="cardFlush">
        {filteredAulas.length === 0 ? (
          <div className="histEmpty">
            {aulas.length === 0
              ? "Todavía no hay aulas registradas."
              : "Ningún aula coincide con la búsqueda o los filtros."}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Aula</th>
                  <th>Nivel</th>
                  <th>Docente</th>
                  <th>Alumnos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageAulas.map((a) => (
                  <tr
                    key={a.id_classroom}
                    className="tblRowClick"
                    onClick={() => openEdit(a)}
                  >
                    <td className="tdName">{a.name}</td>
                    <td className="tdMuted">
                      {a.level ? LEVEL_LABEL[a.level] : LEVEL_UNSET_LABEL}
                    </td>
                    <td className="tdMuted">{a.lead_full_name}</td>
                    <td className="tdMuted">{a.student_count}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <button
                          className="btnGhost tblActionBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAulaId(a.id_classroom);
                          }}
                        >
                          Ver alumnos →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={listCurrentPage}
              setPage={setListPage}
              totalItems={filteredAulas.length}
              pageSize={listPageSize}
              setPageSize={setListPageSize}
            />
          </div>
        )}
      </Card>

      {filtroPanel && (
        <div className="modalOverlay" onClick={() => setFiltroPanel(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Filtros · Aulas
              </div>
              <button
                className="modalX"
                onClick={() => setFiltroPanel(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Nivel</label>
              <select
                className="input"
                value={filtrosDraft.level}
                onChange={(e) =>
                  setFiltrosDraft({
                    ...filtrosDraft,
                    level: e.target.value as ClassroomLevel | "",
                  })
                }
              >
                <option value="">Todos</option>
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Docente</label>
              <select
                className="input"
                value={filtrosDraft.docente}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, docente: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value={UNASSIGNED_LABEL}>{UNASSIGNED_LABEL}</option>
                {teacherOptions.map((t) => (
                  <option key={t.id_user}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Alumnos ≥</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={filtrosDraft.alumnosMin}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, alumnosMin: e.target.value })
                }
              />
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button
                className="btnGhost"
                onClick={() => setFiltrosDraft(EMPTY_FILTERS)}
              >
                Limpiar todo
              </button>
              <button
                className="btn"
                onClick={() => {
                  setFiltros(filtrosDraft);
                  setFiltroPanel(false);
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {aulaPopup && (
        <div className="drawerOverlay" onClick={() => setAulaPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                {aulaPopup.id_classroom ? "Editar aula" : "Nueva aula"}
              </div>
              <button
                className="modalX"
                onClick={() => setAulaPopup(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Nombre del aula</label>
              <input
                className="input"
                placeholder="Ej.: Aula Amarilla"
                value={aulaPopup.name}
                onChange={(e) =>
                  setAulaPopup({ ...aulaPopup, name: e.target.value })
                }
              />
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Nivel</label>
              <select
                className="input"
                value={aulaPopup.level}
                onChange={(e) =>
                  setAulaPopup({
                    ...aulaPopup,
                    level: e.target.value as ClassroomLevel | "",
                  })
                }
              >
                <option value="" disabled={!aulaPopup.id_classroom}>
                  {aulaPopup.id_classroom
                    ? "Sin nivel"
                    : "Selecciona el nivel"}
                </option>
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Docente responsable (lead)</label>
              <select
                className={
                  "input" + (aulaPopup.lead_id_user === "" ? " inputAlert" : "")
                }
                value={aulaPopup.lead_id_user}
                onChange={(e) =>
                  setAulaPopup({
                    ...aulaPopup,
                    lead_id_user: e.target.value as UUID | "",
                  })
                }
              >
                <option value="">{UNASSIGNED_LABEL}</option>
                {teacherOptions.map((t) => (
                  <option key={t.id_user} value={t.id_user}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>
            {popupError && (
              <div className="loginError" role="alert" style={{ marginBottom: 12 }}>
                {popupError}
              </div>
            )}
            <button
              className="btn"
              style={{ width: "100%" }}
              onClick={saveAula}
              disabled={popupSaving}
            >
              {popupSaving
                ? "Guardando…"
                : aulaPopup.id_classroom
                  ? "Guardar cambios"
                  : "Registrar aula"}
            </button>
          </div>
        </div>
      )}

      {importOpen && (
        <ImportPopup
          kind="aulas"
          onClose={() => setImportOpen(false)}
          onConfirm={onImportConfirmed}
          preview={previewClassrooms}
          commit={commitClassrooms}
          onTemplate={downloadClassroomsTemplate}
        />
      )}
    </div>
  );
}
