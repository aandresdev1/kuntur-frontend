import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { useSession } from "@/contexts/SessionContext";
import { ApiError } from "@/lib/api";
import {
  createSubject,
  listSubjects,
  updateSubject,
} from "@/lib/api/subjects";
import type { Subject, UUID } from "@/types/domain";

type SubjectStatus = "active" | "inactive";

interface PopupState {
  id_subject?: UUID;
  name: string;
  status: SubjectStatus;
}

const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);

export default function SubjectsListPage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "teacher") return <Navigate to="/attendance" replace />;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [buscador, setBuscador] = useState("");
  const [buscadorDraft, setBuscadorDraft] = useState("");
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const id_school = session.id_school;

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    listSubjects({ id_school, include_inactive: true })
      .then((rows) => {
        if (cancelled) return;
        setSubjects(rows);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el catálogo de materias.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_school]);

  const active_count = useMemo(
    () => subjects.filter((s) => s.status === "active").length,
    [subjects],
  );
  const inactive_count = subjects.length - active_count;

  const q = buscador.trim().toLowerCase();
  const filtered = subjects.filter((s) =>
    q ? s.name.toLowerCase().includes(q) : true,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openNew = () => {
    setPopup({ name: "", status: "active" });
    setPopupError("");
  };

  const openEdit = (s: Subject) => {
    setPopup({ id_subject: s.id_subject, name: s.name, status: s.status });
    setPopupError("");
  };

  const savePopup = async () => {
    if (!popup || popupSaving) return;
    const name = popup.name.trim();
    if (!name) {
      setPopupError("El nombre es obligatorio.");
      return;
    }
    setPopupSaving(true);
    setPopupError("");
    try {
      if (popup.id_subject) {
        const updated = await updateSubject(
          popup.id_subject,
          { name, status: popup.status },
          { id_school },
        );
        setSubjects((prev) =>
          prev.map((s) =>
            s.id_subject === updated.id_subject ? updated : s,
          ),
        );
      } else {
        const created = await createSubject({
          name,
          status: popup.status,
          id_school,
        });
        setSubjects((prev) => [created, ...prev]);
      }
      setPopup(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la materia.",
      );
    } finally {
      setPopupSaving(false);
    }
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Materias.</div>
        <div className="pageSub">Cargando materias…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Materias.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Materias.</div>
      <div className="pageSub">
        {subjects.length} en el catálogo · {active_count} activas ·{" "}
        {inactive_count} inactivas
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
          <button className="btn" onClick={openNew}>
            + Nueva materia
          </button>
        </div>
      </div>

      <Card className="cardFlush">
        {filtered.length === 0 ? (
          <div className="histEmpty">
            {subjects.length === 0
              ? "Todavía no hay materias en el catálogo de este colegio."
              : "Ninguna materia coincide con la búsqueda."}
          </div>
        ) : (
          <div className="tableWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Materia</th>
                  <th style={{ width: 140 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => (
                  <tr
                    key={s.id_subject}
                    className="tblRowClick"
                    onClick={() => openEdit(s)}
                  >
                    <td>
                      <div className="tdName">{s.name}</div>
                    </td>
                    <td>
                      <span
                        className={
                          "cellTag" +
                          (s.status === "inactive" ? " cellTagWarn" : "")
                        }
                      >
                        {s.status === "active" ? "Activa" : "Inactiva"}
                      </span>
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

      {popup && (
        <div className="drawerOverlay" onClick={() => setPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17, paddingRight: 12 }}>
                {popup.id_subject ? "Editar materia" : "Nueva materia"}
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
              <label className="aulaLbl">Nombre</label>
              <input
                className="input"
                placeholder="Ej. Comunicación, Matemática, Ciencia y Ambiente"
                value={popup.name}
                onChange={(e) => setPopup({ ...popup, name: e.target.value })}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Estado</label>
              <select
                className="input"
                value={popup.status}
                onChange={(e) =>
                  setPopup({
                    ...popup,
                    status: e.target.value as SubjectStatus,
                  })
                }
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
              <div className="hintSmall">
                Las materias inactivas se conservan por histórico; no aparecen
                en pickers al asignar docentes o registrar observaciones.
              </div>
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
                : popup.id_subject
                  ? "Guardar cambios"
                  : "Registrar materia"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
