import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Pagination } from "@/components/Pagination";
import { useSession } from "@/contexts/SessionContext";
import { ImportPopup } from "@/features/import/ImportPopup";
import type { ImportRow } from "@/data/importDemo";
import { ApiError } from "@/lib/api";
import { listClassrooms } from "@/lib/api/classrooms";
import {
  assignGuardian,
  commitStudentsFile,
  createStudent,
  downloadStudentsTemplate,
  getStudent,
  listStudents,
  previewStudentsFile,
  unassignGuardian,
  updateStudent,
  type StudentWithRelations,
} from "@/lib/api/students";
import { createUser, listUsers, type ApiUser } from "@/lib/api/users";
import type {
  Classroom,
  Student,
  StudentStatus,
  UUID,
} from "@/types/domain";

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Activo",
  withdrawn: "Retirado",
};

interface Filters {
  id_classroom: string;
  status: string; // "" | "active" | "withdrawn"
}

const EMPTY_FILTERS: Filters = {
  id_classroom: "",
  status: "",
};

interface AlumnoPopupState {
  id_student?: UUID;
  full_name: string;
  id_classroom: string; // "" means unassigned
  birth_date: string;
  enrolled_at: string;
  status: StudentStatus;
}

interface NewGuardianDraft {
  mode: "existing" | "new";
  id_user_existing: string;
  full_name: string;
  email: string;
  password: string;
}

const EMPTY_GUARDIAN_DRAFT: NewGuardianDraft = {
  mode: "existing",
  id_user_existing: "",
  full_name: "",
  email: "",
  password: "",
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
const FAMILY_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="3" /><circle cx="17" cy="8" r="3" /><path d="M2 20c0-3 2.5-5 6-5s6 2 6 5" /><path d="M12.5 15c3 .3 4.5 2 4.5 5" />
  </svg>
);

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StudentsListPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;

  const is_teacher = session.role === "teacher";
  const id_school = session.id_school;

  const [students, setStudents] = useState<Student[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<Classroom[]>([]);
  const [guardianUsers, setGuardianUsers] = useState<ApiUser[]>([]);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");

  const [buscador, setBuscador] = useState("");
  const [buscadorDraft, setBuscadorDraft] = useState("");
  const [filtros, setFiltros] = useState<Filters>(EMPTY_FILTERS);
  const [filtrosDraft, setFiltrosDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filtroPanel, setFiltroPanel] = useState(false);

  const [alumnoPopup, setAlumnoPopup] = useState<AlumnoPopupState | null>(null);
  const [alumnoSaving, setAlumnoSaving] = useState(false);
  const [alumnoError, setAlumnoError] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const [familiaId, setFamiliaId] = useState<UUID | null>(null);
  const [familiaTab, setFamiliaTab] = useState<"list" | "add">("list");
  const [familiaDetail, setFamiliaDetail] = useState<StudentWithRelations | null>(null);
  const [familiaStatus, setFamiliaStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [familiaError, setFamiliaError] = useState("");
  const [familiaSaving, setFamiliaSaving] = useState(false);
  const [nuevoFamiliar, setNuevoFamiliar] = useState<NewGuardianDraft>(EMPTY_GUARDIAN_DRAFT);

  const openFamilia = (id_student: UUID) => {
    setFamiliaId(id_student);
    setFamiliaTab("list");
    setNuevoFamiliar(EMPTY_GUARDIAN_DRAFT);
    setFamiliaError("");
  };

  const closeFamilia = () => {
    setFamiliaId(null);
    setFamiliaError("");
    setNuevoFamiliar(EMPTY_GUARDIAN_DRAFT);
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    async function load() {
      try {
        // Backend ya filtra /classrooms y /students por las aulas del docente
        // cuando el actor es teacher (ver ClassroomService.findAll y
        // StudentService.findAll). Los apoderados solo los necesita Dirección
        // (el botón "Familias" está oculto para docente).
        const [allClassrooms, allStudents, guardians] = await Promise.all([
          listClassrooms({ id_school }),
          listStudents({ id_school }),
          is_teacher
            ? Promise.resolve<ApiUser[]>([])
            : listUsers({ role: "guardian", id_school }),
        ]);
        if (cancelled) return;
        setClassroomOptions(allClassrooms);
        setStudents(allStudents);
        setGuardianUsers(guardians);
        setLoadStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los alumnos.",
        );
        setLoadStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id_school, is_teacher]);

  // Load guardian_links whenever the family drawer opens on a new student.
  useEffect(() => {
    if (!familiaId) {
      setFamiliaDetail(null);
      setFamiliaStatus("idle");
      setFamiliaError("");
      return;
    }
    let cancelled = false;
    setFamiliaStatus("loading");
    setFamiliaError("");
    getStudent(familiaId, { id_school })
      .then((detail) => {
        if (cancelled) return;
        setFamiliaDetail(detail);
        setFamiliaStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setFamiliaError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los apoderados.",
        );
        setFamiliaStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [familiaId, id_school]);

  const classroomById = useMemo(() => {
    const m = new Map<UUID, Classroom>();
    for (const c of classroomOptions) m.set(c.id_classroom, c);
    return m;
  }, [classroomOptions]);

  const activeFilterCount = Object.values(filtros).filter(Boolean).length;

  const q = buscador.trim().toLowerCase();
  const filtered = students.filter((s) => {
    if (q && !s.full_name.toLowerCase().includes(q)) return false;
    if (filtros.id_classroom && s.id_classroom !== filtros.id_classroom)
      return false;
    if (filtros.status && s.status !== filtros.status) return false;
    // filtros.apoderado is a mock filter — cannot resolve guardian without an
    // extra fetch per row. Ignored client-side.
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const teacherAula =
    is_teacher && classroomOptions[0] ? classroomOptions[0] : null;
  const pageSubText = is_teacher
    ? `${students.length} alumnos${teacherAula ? ` · ${teacherAula.name}` : ""}`
    : `${students.length} matriculados · ${classroomOptions.length} aulas activas`;

  const openNew = () => {
    setAlumnoPopup({
      full_name: "",
      id_classroom: classroomOptions[0]?.id_classroom ?? "",
      birth_date: "",
      enrolled_at: today(),
      status: "active",
    });
    setAlumnoError("");
  };

  const openEdit = (s: Student) => {
    setAlumnoPopup({
      id_student: s.id_student,
      full_name: s.full_name,
      id_classroom: s.id_classroom ?? "",
      birth_date: s.birth_date?.slice(0, 10) ?? "",
      enrolled_at: s.enrolled_at?.slice(0, 10) ?? today(),
      status: s.status,
    });
    setAlumnoError("");
  };

  const saveAlumno = async () => {
    if (!alumnoPopup || alumnoSaving || is_teacher) return;
    const full_name = alumnoPopup.full_name.trim();
    if (!full_name) {
      setAlumnoError("El nombre es obligatorio.");
      return;
    }
    if (!alumnoPopup.birth_date) {
      setAlumnoError("La fecha de nacimiento es obligatoria.");
      return;
    }
    if (!alumnoPopup.enrolled_at) {
      setAlumnoError("La fecha de matrícula es obligatoria.");
      return;
    }
    setAlumnoSaving(true);
    setAlumnoError("");
    try {
      if (alumnoPopup.id_student) {
        const updated = await updateStudent(
          alumnoPopup.id_student,
          {
            full_name,
            id_classroom: alumnoPopup.id_classroom || null,
            birth_date: alumnoPopup.birth_date,
            enrolled_at: alumnoPopup.enrolled_at,
            status: alumnoPopup.status,
          },
          { id_school },
        );
        setStudents((prev) =>
          prev.map((s) => (s.id_student === updated.id_student ? updated : s)),
        );
      } else {
        const created = await createStudent({
          full_name,
          id_school,
          id_classroom: alumnoPopup.id_classroom || null,
          birth_date: alumnoPopup.birth_date,
          enrolled_at: alumnoPopup.enrolled_at,
          status: alumnoPopup.status,
        });
        setStudents((prev) => [created, ...prev]);
      }
      setAlumnoPopup(null);
    } catch (err) {
      setAlumnoError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el alumno.",
      );
    } finally {
      setAlumnoSaving(false);
    }
  };

  const reloadStudents = async () => {
    try {
      const refreshed = await listStudents({ id_school });
      setStudents(refreshed);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "No se pudo refrescar la lista de alumnos.",
      );
      setLoadStatus("error");
    }
  };

  const previewStudents = async (file: File): Promise<ImportRow[]> => {
    const summary = await previewStudentsFile(file, { id_school });
    return summary.rows;
  };

  const commitStudents = async (file: File): Promise<ImportRow[]> => {
    const summary = await commitStudentsFile(file, { id_school });
    await reloadStudents();
    return summary.rows;
  };

  const onImportConfirmed = () => {
    // Refetch already happened inside commitStudents; nothing else to do.
  };

  const addGuardian = async () => {
    if (!familiaId || familiaSaving) return;
    setFamiliaSaving(true);
    setFamiliaError("");
    try {
      let id_user: UUID;
      if (nuevoFamiliar.mode === "existing") {
        if (!nuevoFamiliar.id_user_existing) {
          setFamiliaError("Selecciona un apoderado existente.");
          return;
        }
        id_user = nuevoFamiliar.id_user_existing;
      } else {
        const full_name = nuevoFamiliar.full_name.trim();
        const email = nuevoFamiliar.email.trim();
        if (!full_name) {
          setFamiliaError("El nombre del apoderado es obligatorio.");
          return;
        }
        if (!email) {
          setFamiliaError("El correo es obligatorio.");
          return;
        }
        if (nuevoFamiliar.password.length < 8) {
          setFamiliaError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
        const created = await createUser({
          full_name,
          email,
          password: nuevoFamiliar.password,
          roles: ["guardian"],
          id_school,
        });
        id_user = created.id_user;
        setGuardianUsers((prev) => [...prev, created]);
      }
      await assignGuardian(familiaId, id_user, { id_school });
      const refreshed = await getStudent(familiaId, { id_school });
      setFamiliaDetail(refreshed);
      setNuevoFamiliar(EMPTY_GUARDIAN_DRAFT);
    } catch (err) {
      setFamiliaError(
        err instanceof ApiError
          ? err.message
          : "No se pudo agregar el apoderado.",
      );
    } finally {
      setFamiliaSaving(false);
    }
  };

  const removeGuardian = async (id_student_guardian: UUID) => {
    if (!familiaId || familiaSaving) return;
    setFamiliaSaving(true);
    setFamiliaError("");
    try {
      await unassignGuardian(familiaId, id_student_guardian, { id_school });
      const refreshed = await getStudent(familiaId, { id_school });
      setFamiliaDetail(refreshed);
    } catch (err) {
      setFamiliaError(
        err instanceof ApiError
          ? err.message
          : "No se pudo quitar el apoderado.",
      );
    } finally {
      setFamiliaSaving(false);
    }
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Alumnos.</div>
        <div className="pageSub">Cargando alumnos…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Alumnos.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  const linkedGuardianIds = new Set(
    familiaDetail?.guardian_links.map((l) => l.id_user) ?? [],
  );
  const availableGuardians = guardianUsers.filter(
    (g) => !linkedGuardianIds.has(g.id_user),
  );

  return (
    <div>
      <div className="pageTitle">Alumnos.</div>
      <div className="pageSub">{pageSubText}</div>

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
          {!is_teacher && (
            <>
              <button
                className="btnGhost btnLbl"
                title="Importar alumnos desde Excel"
                aria-label="Importar alumnos"
                onClick={() => setImportOpen(true)}
              >
                {IMPORT_ICON}
                Importar
              </button>
              <button className="btn" onClick={openNew}>
                + Nuevo alumno
              </button>
            </>
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="chipsBar">
          {filtros.id_classroom && (
            <span className="filtroChip">
              Aula:{" "}
              {classroomById.get(filtros.id_classroom)?.name ?? "—"}{" "}
              <button onClick={() => setFiltros({ ...filtros, id_classroom: "" })}>✕</button>
            </span>
          )}
          {filtros.status && (
            <span className="filtroChip">
              Estado: {STATUS_LABEL[filtros.status as StudentStatus]}{" "}
              <button onClick={() => setFiltros({ ...filtros, status: "" })}>✕</button>
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
        {filtered.length === 0 ? (
          <div className="histEmpty">
            {students.length === 0
              ? "Todavía no hay alumnos registrados."
              : "Ningún alumno coincide con la búsqueda o los filtros."}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Aula</th>
                  {!is_teacher && <th>Apoderados asignados</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => {
                  const classroom = s.id_classroom
                    ? classroomById.get(s.id_classroom)
                    : null;
                  const hasGuardian = (s.guardian_count ?? 0) >= 1;
                  return (
                    <tr
                      key={s.id_student}
                      className="tblRowClick"
                      onClick={() => openEdit(s)}
                    >
                      <td>
                        <div className="tdName">
                          <Avatar full_name={s.full_name} size={28} />
                          <div>
                            {s.full_name}
                            {s.status === "withdrawn" && (
                              <div className="hintSmall">Retirado</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cellTag">
                          {classroom?.name ?? "Sin aula"}
                        </span>
                      </td>
                      {!is_teacher && (
                        <td style={{ textAlign: "center" }}>
                          {hasGuardian ? (
                            <span style={{ color: "var(--green)", fontWeight: 600, fontSize: 15 }}>✓</span>
                          ) : (
                            <span style={{ color: "var(--ink-soft)" }}>—</span>
                          )}
                        </td>
                      )}
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button
                            className="btnGhost btnIcon"
                            title="Ficha del alumno"
                            aria-label={"Ficha de " + s.full_name}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/students/${s.id_student}`);
                            }}
                          >
                            {FICHA_ICON}
                          </button>
                          <button
                            className="btnGhost btnIcon"
                            title="Comunicados"
                            aria-label={"Comunicados de " + s.full_name}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/announcements?student=${s.id_student}&from=alumnos`,
                              );
                            }}
                          >
                            {CHAT_ICON}
                          </button>
                          {!is_teacher && (
                            <button
                              className="btnGhost btnIcon"
                              title="Familias"
                              aria-label={"Familias de " + s.full_name}
                              onClick={(e) => {
                                e.stopPropagation();
                                openFamilia(s.id_student);
                              }}
                            >
                              {FAMILY_ICON}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={currentPage}
              setPage={setPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </div>
        )}
      </Card>

      {filtroPanel && (
        <div className="modalOverlay" onClick={() => setFiltroPanel(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Filtros · Alumnos
              </div>
              <button className="modalX" onClick={() => setFiltroPanel(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            {!is_teacher && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="aulaLbl">Aula</label>
                <select
                  className="input"
                  value={filtrosDraft.id_classroom}
                  onChange={(e) =>
                    setFiltrosDraft({ ...filtrosDraft, id_classroom: e.target.value })
                  }
                >
                  <option value="">Todas</option>
                  {classroomOptions.map((c) => (
                    <option key={c.id_classroom} value={c.id_classroom}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Estado</label>
              <select
                className="input"
                value={filtrosDraft.status}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, status: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="withdrawn">Retirado</option>
              </select>
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

      {familiaId && (() => {
        const alumnoF = students.find((s) => s.id_student === familiaId);
        if (!alumnoF) return null;
        const guardianCount = familiaDetail?.guardian_links.length ?? 0;
        return (
          <div className="modalOverlay" onClick={closeFamilia}>
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <div className="modalHead">
                <div className="fichaName" style={{ fontSize: 17 }}>
                  Familias · {alumnoF.full_name}
                </div>
                <button
                  className="modalX"
                  onClick={closeFamilia}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="drawerTabs">
                <button
                  className={
                    "drawerTab" + (familiaTab === "list" ? " drawerTabOn" : "")
                  }
                  onClick={() => setFamiliaTab("list")}
                >
                  Apoderados{" "}
                  <span className="drawerTabNum">{guardianCount}</span>
                </button>
                <button
                  className={
                    "drawerTab" + (familiaTab === "add" ? " drawerTabOn" : "")
                  }
                  onClick={() => {
                    setFamiliaTab("add");
                    setFamiliaError("");
                  }}
                >
                  Agregar
                </button>
              </div>

              {familiaStatus === "loading" && (
                <div className="hintSmall" style={{ marginTop: 12 }}>
                  Cargando apoderados…
                </div>
              )}
              {familiaStatus === "error" && (
                <div className="loginError" role="alert" style={{ marginTop: 12 }}>
                  {familiaError}
                </div>
              )}

              {familiaStatus === "ready" && familiaDetail && familiaTab === "list" && (
                <div className="famList" style={{ borderTop: 0, paddingTop: 12 }}>
                  {familiaDetail.guardian_links.length === 0 ? (
                    <div className="hintSmall">
                      Este alumno todavía no tiene apoderados registrados.
                      Cambia a la pestaña <strong>Agregar</strong> para vincular
                      uno.
                    </div>
                  ) : (
                    familiaDetail.guardian_links.map((l) => (
                      <div key={l.id_student_guardian} className="famRow">
                        <Avatar full_name={l.user.full_name} size={30} />
                        <div style={{ flex: 1 }}>
                          <span className="famName">{l.user.full_name}</span>
                          <div className="fichaSub" style={{ margin: 0 }}>
                            {l.user.email}
                          </div>
                        </div>
                        <Chip tone="green">Vinculado</Chip>
                        <button
                          className="btnGhost btnIcon"
                          title="Quitar vínculo"
                          aria-label={"Quitar a " + l.user.full_name}
                          onClick={() => removeGuardian(l.id_student_guardian)}
                          disabled={familiaSaving}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {familiaStatus === "ready" && familiaDetail && familiaTab === "add" && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label className="aulaLbl">Origen del apoderado</label>
                    <div className="radioRow">
                      <label
                        className={
                          "radioPill" +
                          (nuevoFamiliar.mode === "existing" ? " radioOn" : "")
                        }
                      >
                        <input
                          type="radio"
                          name="guardian_mode"
                          checked={nuevoFamiliar.mode === "existing"}
                          onChange={() =>
                            setNuevoFamiliar((p) => ({ ...p, mode: "existing" }))
                          }
                        />
                        Existente en el colegio
                      </label>
                      <label
                        className={
                          "radioPill" +
                          (nuevoFamiliar.mode === "new" ? " radioOn" : "")
                        }
                      >
                        <input
                          type="radio"
                          name="guardian_mode"
                          checked={nuevoFamiliar.mode === "new"}
                          onChange={() =>
                            setNuevoFamiliar((p) => ({ ...p, mode: "new" }))
                          }
                        />
                        Crear cuenta nueva
                      </label>
                    </div>
                  </div>

                  {nuevoFamiliar.mode === "existing" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label className="aulaLbl">Apoderado</label>
                      <select
                        className="input"
                        value={nuevoFamiliar.id_user_existing}
                        onChange={(e) =>
                          setNuevoFamiliar((p) => ({
                            ...p,
                            id_user_existing: e.target.value,
                          }))
                        }
                      >
                        <option value="">— Selecciona un apoderado —</option>
                        {availableGuardians.map((g) => (
                          <option key={g.id_user} value={g.id_user}>
                            {g.full_name} · {g.email}
                          </option>
                        ))}
                      </select>
                      {availableGuardians.length === 0 && (
                        <div className="hintSmall">
                          No hay más apoderados registrados sin vincular. Cambia
                          a <strong>Crear cuenta nueva</strong>.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label className="aulaLbl">Datos de la cuenta</label>
                      <input
                        className="input"
                        placeholder="Nombres y apellidos"
                        value={nuevoFamiliar.full_name}
                        onChange={(e) =>
                          setNuevoFamiliar((p) => ({
                            ...p,
                            full_name: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="input"
                        type="email"
                        placeholder="Correo (será su usuario)"
                        value={nuevoFamiliar.email}
                        onChange={(e) =>
                          setNuevoFamiliar((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                      />
                      <input
                        className="input"
                        type="password"
                        placeholder="Contraseña inicial (mín. 8)"
                        value={nuevoFamiliar.password}
                        onChange={(e) =>
                          setNuevoFamiliar((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {familiaError && (
                    <div className="loginError" role="alert">
                      {familiaError}
                    </div>
                  )}

                  <button
                    className="btn"
                    style={{ width: "100%" }}
                    onClick={async () => {
                      await addGuardian();
                      // Si el guardado fue exitoso (no quedó error), volver a
                      // la lista para que el usuario vea el resultado.
                      setFamiliaTab((prevTab) =>
                        familiaError ? prevTab : "list",
                      );
                    }}
                    disabled={familiaSaving}
                  >
                    {familiaSaving ? "Guardando…" : "+ Agregar apoderado"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {alumnoPopup && (
        <div className="drawerOverlay" onClick={() => setAlumnoPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                {is_teacher
                  ? "Datos del alumno"
                  : alumnoPopup.id_student
                    ? "Editar alumno"
                    : "Nuevo alumno"}
              </div>
              <button
                className="modalX"
                onClick={() => setAlumnoPopup(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            {is_teacher && (
              <p className="hint" style={{ marginTop: 0 }}>
                Solo lectura. Los datos de matrícula los edita Dirección.
              </p>
            )}
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Nombres y apellidos</label>
              <input
                className="input"
                style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                placeholder="Nombres y apellidos"
                value={alumnoPopup.full_name}
                readOnly={is_teacher}
                disabled={is_teacher}
                onChange={(e) =>
                  setAlumnoPopup({ ...alumnoPopup, full_name: e.target.value })
                }
              />
            </div>
            <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="aulaLbl">Fecha de nacimiento</label>
                <input
                  className="input"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                  type="date"
                  value={alumnoPopup.birth_date}
                  readOnly={is_teacher}
                  disabled={is_teacher}
                  onChange={(e) =>
                    setAlumnoPopup({ ...alumnoPopup, birth_date: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="aulaLbl">Matriculado el</label>
                <input
                  className="input"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                  type="date"
                  value={alumnoPopup.enrolled_at}
                  readOnly={is_teacher}
                  disabled={is_teacher}
                  onChange={(e) =>
                    setAlumnoPopup({ ...alumnoPopup, enrolled_at: e.target.value })
                  }
                />
              </div>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Aula</label>
              <select
                className="input"
                style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                value={alumnoPopup.id_classroom}
                disabled={is_teacher}
                onChange={(e) =>
                  setAlumnoPopup({ ...alumnoPopup, id_classroom: e.target.value })
                }
              >
                <option value="" disabled>Selecciona un aula</option>
                {classroomOptions.map((c) => (
                  <option key={c.id_classroom} value={c.id_classroom}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Estado</label>
              <select
                className="input"
                style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                value={alumnoPopup.status}
                disabled={is_teacher}
                onChange={(e) =>
                  setAlumnoPopup({
                    ...alumnoPopup,
                    status: e.target.value as StudentStatus,
                  })
                }
              >
                <option value="active">Activo</option>
                <option value="withdrawn">Retirado</option>
              </select>
            </div>
            {alumnoError && (
              <div className="loginError" role="alert" style={{ marginBottom: 12 }}>
                {alumnoError}
              </div>
            )}
            {is_teacher ? (
              <button
                className="btnGhost"
                style={{ width: "100%" }}
                onClick={() => {
                  const id = alumnoPopup.id_student;
                  setAlumnoPopup(null);
                  if (id) navigate(`/students/${id}`);
                }}
              >
                Ver ficha del alumno
              </button>
            ) : (
              <button
                className="btn"
                style={{ width: "100%" }}
                onClick={saveAlumno}
                disabled={alumnoSaving}
              >
                {alumnoSaving
                  ? "Guardando…"
                  : alumnoPopup.id_student
                    ? "Guardar cambios"
                    : "Registrar alumno"}
              </button>
            )}
          </div>
        </div>
      )}

      {importOpen && (
        <ImportPopup
          kind="alumnos"
          onClose={() => setImportOpen(false)}
          onConfirm={onImportConfirmed}
          preview={previewStudents}
          commit={commitStudents}
          onTemplate={downloadStudentsTemplate}
        />
      )}
    </div>
  );
}
