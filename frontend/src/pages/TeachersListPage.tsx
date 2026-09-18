import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { useSession } from "@/contexts/SessionContext";
import { ImportPopup } from "@/features/import/ImportPopup";
import type { ImportRow } from "@/data/importDemo";
import { ApiError } from "@/lib/api";
import {
  getClassroom,
  listClassrooms,
  type ClassroomWithLinks,
} from "@/lib/api/classrooms";
import {
  commitTeachersFile,
  createUser,
  downloadTeachersTemplate,
  listUsers,
  previewTeachersFile,
  updateUser,
  type ApiUser,
} from "@/lib/api/users";
import type { UUID } from "@/types/domain";

interface TeacherRow {
  id_user: UUID;
  full_name: string;
  email: string;
  lead_classrooms: string[];
}

interface Filters {
  sinAsignar: boolean;
}

const EMPTY_FILTERS: Filters = { sinAsignar: false };

interface TeacherPopupState {
  id_user?: UUID;
  full_name: string;
  email: string;
  password: string;
}

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

// Fetch every classroom's teacher_links so we can compute lead assignments per
// teacher and the "aulas sin asignar" count. N+1 is acceptable for small
// schools; if this becomes a bottleneck we'll add a bulk include to the API.
async function fetchClassroomsWithLinks(
  id_school: UUID | null,
): Promise<ClassroomWithLinks[]> {
  const list = await listClassrooms({ id_school });
  return Promise.all(
    list.map((c) =>
      getClassroom(c.id_classroom, { id_school: id_school ?? undefined }),
    ),
  );
}

function toRow(
  u: ApiUser,
  classrooms: ClassroomWithLinks[],
): TeacherRow {
  const lead_names = classrooms
    .filter((c) =>
      c.teacher_links.some((l) => l.id_user === u.id_user && l.role === "lead"),
    )
    .map((c) => c.name);
  return {
    id_user: u.id_user,
    full_name: u.full_name,
    email: u.email,
    lead_classrooms: lead_names,
  };
}

export default function TeachersListPage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "teacher") return <Navigate to="/attendance" replace />;

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomWithLinks[]>([]);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");

  const [buscador, setBuscador] = useState("");
  const [buscadorDraft, setBuscadorDraft] = useState("");
  const [filtros, setFiltros] = useState<Filters>(EMPTY_FILTERS);
  const [filtrosDraft, setFiltrosDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filtroPanel, setFiltroPanel] = useState(false);
  const [popup, setPopup] = useState<TeacherPopupState | null>(null);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const id_school = session.id_school;

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    Promise.all([
      listUsers({ role: "teacher", id_school }),
      fetchClassroomsWithLinks(id_school),
    ])
      .then(([users, cls]) => {
        if (cancelled) return;
        setClassrooms(cls);
        setTeachers(users.map((u) => toRow(u, cls)));
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la lista de docentes.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_school]);

  const unassigned_classrooms = useMemo(
    () =>
      classrooms.filter(
        (c) => !c.teacher_links.some((l) => l.role === "lead"),
      ).length,
    [classrooms],
  );

  const activeFilterCount = filtros.sinAsignar ? 1 : 0;

  const q = buscador.trim().toLowerCase();
  const filtered = teachers.filter((t) => {
    if (
      q &&
      !(
        t.full_name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      )
    )
      return false;
    if (filtros.sinAsignar && t.lead_classrooms.length > 0) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openNew = () => {
    setPopup({ full_name: "", email: "", password: "" });
    setPopupError("");
  };

  const openEdit = (t: TeacherRow) => {
    setPopup({ id_user: t.id_user, full_name: t.full_name, email: t.email, password: "" });
    setPopupError("");
  };

  const savePopup = async () => {
    if (!popup || popupSaving) return;
    const full_name = popup.full_name.trim();
    if (!full_name) {
      setPopupError("El nombre es obligatorio.");
      return;
    }
    setPopupSaving(true);
    setPopupError("");
    try {
      if (popup.id_user) {
        const updated = await updateUser(
          popup.id_user,
          {
            full_name,
            ...(popup.password ? { password: popup.password } : {}),
          },
          { id_school },
        );
        setTeachers((prev) =>
          prev.map((t) =>
            t.id_user === updated.id_user
              ? { ...t, full_name: updated.full_name, email: updated.email }
              : t,
          ),
        );
      } else {
        const email = popup.email.trim();
        if (!email) {
          setPopupError("El correo es obligatorio.");
          return;
        }
        if (popup.password.length < 8) {
          setPopupError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }
        const created = await createUser({
          full_name,
          email,
          password: popup.password,
          roles: ["teacher"],
          id_school,
        });
        setTeachers((prev) => [
          {
            id_user: created.id_user,
            full_name: created.full_name,
            email: created.email,
            lead_classrooms: [],
          },
          ...prev,
        ]);
      }
      setPopup(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el docente.",
      );
    } finally {
      setPopupSaving(false);
    }
  };

  const reloadFromServer = async () => {
    try {
      const [users, cls] = await Promise.all([
        listUsers({ role: "teacher", id_school }),
        fetchClassroomsWithLinks(id_school),
      ]);
      setClassrooms(cls);
      setTeachers(users.map((u) => toRow(u, cls)));
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : "No se pudo refrescar la lista de docentes.",
      );
      setLoadStatus("error");
    }
  };

  // Two-step flow: `preview` is a dry-run POST (server validates but doesn't
  // persist), `commit` is the actual insert. ImportPopup drives the sequence
  // and only calls `commit` after the user confirms the plan.
  const previewTeachers = async (file: File): Promise<ImportRow[]> => {
    const summary = await previewTeachersFile(file, { id_school });
    return summary.rows;
  };

  const commitTeachers = async (file: File): Promise<ImportRow[]> => {
    const summary = await commitTeachersFile(file, { id_school });
    await reloadFromServer();
    return summary.rows;
  };

  const onImportConfirmed = () => {
    // Refetch already happened inside `commitTeachers`; nothing else to do.
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Docentes.</div>
        <div className="pageSub">Cargando docentes…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Docentes.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Docentes.</div>
      <div className="pageSub">
        {teachers.length} registrados · {unassigned_classrooms} aulas sin
        docente asignado
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
            title="Importar docentes desde Excel"
            aria-label="Importar profesores"
            onClick={() => setImportOpen(true)}
          >
            {IMPORT_ICON}
            Importar
          </button>
          <button className="btn" onClick={openNew}>
            + Nuevo docente
          </button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="chipsBar">
          {filtros.sinAsignar && (
            <span className="filtroChip">
              Sin aula asignada{" "}
              <button onClick={() => setFiltros({ ...filtros, sinAsignar: false })}>✕</button>
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
            {teachers.length === 0
              ? "Todavía no hay docentes registrados en este colegio."
              : "Ningún docente coincide con la búsqueda o los filtros."}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Correo</th>
                  <th>Aulas asignadas</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t) => (
                  <tr
                    key={t.id_user}
                    className="tblRowClick"
                    onClick={() => openEdit(t)}
                  >
                    <td>
                      <div className="tdName">
                        <Avatar full_name={t.full_name} size={28} />
                        {t.full_name}
                      </div>
                    </td>
                    <td className="tdMuted">{t.email}</td>
                    <td>
                      {t.lead_classrooms.length ? (
                        <div className="cellTags">
                          {t.lead_classrooms.map((n) => (
                            <span key={n} className="cellTag">
                              {n}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="cellTag cellTagWarn">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
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
                Filtros · Docentes
              </div>
              <button
                className="modalX"
                onClick={() => setFiltroPanel(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={filtrosDraft.sinAsignar}
                onChange={(e) =>
                  setFiltrosDraft({
                    ...filtrosDraft,
                    sinAsignar: e.target.checked,
                  })
                }
              />
              Solo sin aula asignada
            </label>
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

      {popup && (
        <div className="drawerOverlay" onClick={() => setPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17, paddingRight: 12 }}>
                {popup.id_user ? "Editar docente" : "Nuevo docente"}
              </div>
              <button
                className="modalX"
                onClick={() => setPopup(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Nombres y apellidos</label>
              <input
                className="input"
                placeholder="Nombres y apellidos"
                value={popup.full_name}
                onChange={(e) => setPopup({ ...popup, full_name: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Correo</label>
              <input
                className="input"
                placeholder="Correo"
                type="email"
                value={popup.email}
                readOnly={!!popup.id_user}
                disabled={!!popup.id_user}
                onChange={(e) => setPopup({ ...popup, email: e.target.value })}
              />
              {popup.id_user && (
                <div className="hintSmall">
                  El correo no se puede modificar desde esta vista.
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">
                {popup.id_user ? "Nueva contraseña (opcional)" : "Contraseña"}
              </label>
              <input
                className="input"
                type="password"
                placeholder={
                  popup.id_user
                    ? "Dejar en blanco para no cambiar"
                    : "Mínimo 8 caracteres"
                }
                value={popup.password}
                onChange={(e) => setPopup({ ...popup, password: e.target.value })}
              />
            </div>
            {popupError && (
              <div className="loginError" role="alert" style={{ marginBottom: 12 }}>
                {popupError}
              </div>
            )}
            <button
              className="btn"
              style={{ width: "100%" }}
              onClick={savePopup}
              disabled={popupSaving}
            >
              {popupSaving
                ? "Guardando…"
                : popup.id_user
                  ? "Guardar cambios"
                  : "Registrar profesor"}
            </button>
          </div>
        </div>
      )}

      {importOpen && (
        <ImportPopup
          kind="profesores"
          onClose={() => setImportOpen(false)}
          onConfirm={onImportConfirmed}
          preview={previewTeachers}
          commit={commitTeachers}
          onTemplate={downloadTeachersTemplate}
        />
      )}
    </div>
  );
}
