import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { MicButton } from "@/components/MicButton";
import { Pagination } from "@/components/Pagination";
import { VoiceDots } from "@/components/VoiceDots";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/contexts/ToastContext";
import { VOICE_SAMPLES_ANNOUNCEMENT } from "@/data/voiceSamples";
import { pickRandom } from "@/lib/random";
import { ApiError } from "@/lib/api";
import {
  createAnnouncement,
  generateAnnouncementDraft,
  getAnnouncement,
  getAnnouncementStatus,
  listAnnouncements,
  updateAnnouncement,
  type AnnouncementReadStatusRow,
  type AnnouncementWithRelations,
} from "@/lib/api/announcements";
import { getClassroom, listClassrooms } from "@/lib/api/classrooms";
import { getStudent, listStudents } from "@/lib/api/students";
import type {
  AnnouncementScope,
  AnnouncementType,
  Classroom,
  Student,
  UUID,
} from "@/types/domain";

type VoiceState =
  | { mode: "idle"; transcript: string }
  | { mode: "listening"; transcript: string }
  | { mode: "processing"; transcript: string }
  | { mode: "ready"; transcript: string };

const TYPE_LABEL: Record<AnnouncementType, string> = {
  authorization: "Autorización",
  informative: "Informativo",
};
const TYPE_FROM_LABEL: Record<string, AnnouncementType> = {
  Autorización: "authorization",
  Informativo: "informative",
  Comunicado: "informative",
};

interface Filters {
  id_classroom: string;
  type: string;
  scope: string;
}

const EMPTY_FILTERS: Filters = {
  id_classroom: "",
  type: "",
  scope: "",
};

const PER_STUDENT_EMPTY: { type: string } = {
  type: "",
};

interface Draft {
  title: string;
  content: string;
  type: AnnouncementType;
  scope: AnnouncementScope;
  id_student_target: UUID | "";
  id_classrooms_target: UUID[];
}

type CreateMode = "picker" | "voz" | "manual";

const MIC_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
    <path d="M6 11a6 6 0 0 0 12 0" />
    <path d="M12 17v4" />
  </svg>
);
const PEN_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AnnouncementsListPage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [search_params, setSearchParams] = useSearchParams();

  if (!session) return null;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;

  const is_teacher = session.role === "teacher";
  const id_school = session.id_school;

  const student_filter_id = search_params.get("student");
  const back_origin = search_params.get("from");

  // ─── Backing data ───────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<AnnouncementWithRelations[]>(
    [],
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [contextClassroomId, setContextClassroomId] = useState<UUID | "">("");
  const [rosterForContext, setRosterForContext] = useState<Student[]>([]);
  const [perStudent, setPerStudent] = useState<{
    student: Awaited<ReturnType<typeof getStudent>> | null;
    loading: boolean;
    error: string;
  }>({ student: null, loading: false, error: "" });

  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");

  const [buscador, setBuscador] = useState("");
  const [buscadorDraft, setBuscadorDraft] = useState("");
  const [filtros, setFiltros] = useState<Filters>(EMPTY_FILTERS);
  const [filtrosDraft, setFiltrosDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filtroPanel, setFiltroPanel] = useState(false);

  const [alBuscador, setAlBuscador] = useState("");
  const [alBuscadorDraft, setAlBuscadorDraft] = useState("");
  const [alFiltros, setAlFiltros] = useState(PER_STUDENT_EMPTY);
  const [alFiltrosDraft, setAlFiltrosDraft] = useState(PER_STUDENT_EMPTY);
  const [alFiltroPanel, setAlFiltroPanel] = useState(false);

  const [ver_id, setVerId] = useState<UUID | null>(null);
  const [ver_detail, setVerDetail] = useState<AnnouncementWithRelations | null>(
    null,
  );
  const [ver_status, setVerStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [ver_error, setVerError] = useState("");
  const [det_tab, setDetTab] = useState<"info" | "estado">("info");
  const [status_rows, setStatusRows] = useState<AnnouncementReadStatusRow[]>([]);
  const [status_state, setStatusState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [status_error, setStatusError] = useState("");

  const [create_drawer_open, setCreateDrawerOpen] = useState(false);
  const [create_mode, setCreateMode] = useState<CreateMode>("voz");
  const [edit_id, setEditId] = useState<UUID | null>(null);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    content: "",
    type: "informative",
    scope: "classroom",
    id_student_target: "",
    id_classrooms_target: [],
  });
  const [voice, setVoice] = useState<VoiceState>({ mode: "idle", transcript: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Initial load ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    setLoadError("");
    async function load() {
      try {
        const cls = await listClassrooms({ id_school });
        if (cancelled) return;
        setClassrooms(cls);

        // Resolve context classroom: for teachers, the first classroom they
        // belong to; for admins, the first classroom of the school.
        let ctx: UUID | "" = cls[0]?.id_classroom ?? "";
        if (is_teacher && cls.length) {
          const details = await Promise.all(
            cls.map((c) =>
              getClassroom(c.id_classroom, { id_school: id_school ?? undefined }),
            ),
          );
          if (cancelled) return;
          const mine = details.find((c) =>
            c.teacher_links.some((l) => l.id_user === session.id_user),
          );
          ctx = mine?.id_classroom ?? "";
        }
        setContextClassroomId(ctx);

        // Roster for context classroom (used by Estado tab + individual picker).
        if (ctx) {
          const students = await listStudents({ id_school, id_classroom: ctx });
          if (cancelled) return;
          setRosterForContext(students);
        }

        // Fetch announcements. When a per-student filter is present, scope the
        // list; otherwise pull everything the actor can see.
        const list = student_filter_id
          ? await listAnnouncements({ id_student: student_filter_id })
          : await listAnnouncements();
        if (cancelled) return;
        setAnnouncements(list);
        setLoadStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar los comunicados.",
        );
        setLoadStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id_school, is_teacher, session.id_user, student_filter_id]);

  // Load the target student if we're in per-student mode.
  useEffect(() => {
    if (!student_filter_id) {
      setPerStudent({ student: null, loading: false, error: "" });
      return;
    }
    let cancelled = false;
    setPerStudent({ student: null, loading: true, error: "" });
    getStudent(student_filter_id, { id_school })
      .then((s) => {
        if (cancelled) return;
        setPerStudent({ student: s, loading: false, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setPerStudent({
          student: null,
          loading: false,
          error:
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar el alumno.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [student_filter_id, id_school]);

  // Load per-guardian read/confirmation status when the Estado tab opens.
  useEffect(() => {
    if (!ver_id || det_tab !== "estado") return;
    let cancelled = false;
    setStatusState("loading");
    setStatusError("");
    getAnnouncementStatus(ver_id)
      .then((rows) => {
        if (cancelled) return;
        setStatusRows(rows);
        setStatusState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatusError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el estado de lectura.",
        );
        setStatusState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ver_id, det_tab]);

  // Reset status when drawer closes.
  useEffect(() => {
    if (!ver_id) {
      setStatusRows([]);
      setStatusState("idle");
      setStatusError("");
    }
  }, [ver_id]);

  // Load fresh detail whenever the drawer opens on a new id.
  useEffect(() => {
    if (!ver_id) {
      setVerDetail(null);
      setVerStatus("idle");
      return;
    }
    let cancelled = false;
    setVerStatus("loading");
    getAnnouncement(ver_id)
      .then((a) => {
        if (cancelled) return;
        setVerDetail(a);
        setVerStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setVerError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el comunicado.",
        );
        setVerStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ver_id]);

  const classroomsById = useMemo(() => {
    const m = new Map<UUID, Classroom>();
    for (const c of classrooms) m.set(c.id_classroom, c);
    return m;
  }, [classrooms]);

  const activeFilterCount = Object.values(filtros).filter(Boolean).length;
  const activeAlFilterCount = Object.values(alFiltros).filter(Boolean).length;

  const recipientsClassrooms = (a: AnnouncementWithRelations): UUID[] =>
    a.recipients.map((r) => r.id_classroom).filter((v): v is UUID => !!v);

  const recipientStudentIds = (a: AnnouncementWithRelations): UUID[] =>
    a.recipients.map((r) => r.id_student).filter((v): v is UUID => !!v);

  const openCreate = (a: AnnouncementWithRelations | null = null) => {
    if (a) {
      setDraft({
        title: a.title,
        content: a.content === "—" ? "" : a.content,
        type: a.type,
        scope: a.scope,
        id_student_target: recipientStudentIds(a)[0] ?? "",
        id_classrooms_target: recipientsClassrooms(a),
      });
      setEditId(a.id_announcement);
      setCreateMode("manual");
    } else {
      setDraft({
        title: "",
        content: "",
        type: "informative",
        scope: "classroom",
        id_student_target: rosterForContext[0]?.id_student ?? "",
        id_classrooms_target: contextClassroomId ? [contextClassroomId] : [],
      });
      setEditId(null);
      setCreateMode("voz");
    }
    setVoice({ mode: "idle", transcript: "" });
    setSaveError("");
    setCreateDrawerOpen(true);
  };

  const openCreateForStudent = (s: {
    id_student: UUID;
    classroom?: { id_classroom: UUID } | null;
  }) => {
    setDraft({
      title: "",
      content: "",
      type: "informative",
      scope: "individual",
      id_student_target: s.id_student,
      id_classrooms_target: s.classroom ? [s.classroom.id_classroom] : [],
    });
    setEditId(null);
    setCreateMode("voz");
    setVoice({ mode: "idle", transcript: "" });
    setSaveError("");
    setCreateDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    setCreateDrawerOpen(false);
    setEditId(null);
    setCreateMode("voz");
    setVoice({ mode: "idle", transcript: "" });
    setSaveError("");
  };

  const dictarVoz = () => {
    setVoice({ mode: "listening", transcript: "" });
    const sample = pickRandom(VOICE_SAMPLES_ANNOUNCEMENT);
    window.setTimeout(() => {
      setVoice({ mode: "idle", transcript: sample });
    }, 1600);
  };

  const generarBorrador = async () => {
    if (voice.mode === "listening" || voice.mode === "processing") return;
    const transcript = voice.transcript.trim();
    if (!transcript) return;
    setVoice({ mode: "processing", transcript });
    setSaveError("");
    try {
      const res = await generateAnnouncementDraft({ transcript });
      setDraft((prev) => ({
        ...prev,
        title: res.title,
        content: res.content,
        type: res.type,
      }));
      setVoice({ mode: "ready", transcript });
    } catch (err) {
      setVoice({ mode: "idle", transcript });
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el borrador. Reintenta.",
      );
    }
  };

  const refreshList = async () => {
    try {
      const list = student_filter_id
        ? await listAnnouncements({ id_student: student_filter_id })
        : await listAnnouncements();
      setAnnouncements(list);
    } catch {
      // best-effort refresh
    }
  };

  const publish = async () => {
    if (!draft.title.trim() || !draft.content.trim() || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      if (edit_id) {
        await updateAnnouncement(edit_id, {
          title: draft.title.trim(),
          content: draft.content.trim(),
        });
      } else {
        const body: Parameters<typeof createAnnouncement>[0] = {
          title: draft.title.trim(),
          content: draft.content.trim(),
          type: draft.type,
          scope: draft.scope,
        };
        if (draft.scope === "individual") {
          if (!draft.id_student_target) {
            setSaveError("Selecciona un alumno.");
            return;
          }
          body.id_students = [draft.id_student_target];
        } else if (draft.scope === "classroom") {
          const target =
            draft.id_classrooms_target[0] ?? contextClassroomId ?? "";
          if (!target) {
            setSaveError("No hay aula de contexto para enviar el comunicado.");
            return;
          }
          body.id_classrooms = [target];
        } else if (draft.scope === "multi_classroom") {
          if (draft.id_classrooms_target.length === 0) {
            setSaveError("Selecciona al menos un aula.");
            return;
          }
          body.id_classrooms = draft.id_classrooms_target;
        }
        await createAnnouncement(body);
      }
      await refreshList();
      showToast(
        edit_id ? "Comunicado actualizado ✓" : "Comunicado publicado ✓",
      );
      closeCreateDrawer();
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo publicar el comunicado.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── PER-STUDENT MODE ────────────────────────────────────────────────
  if (student_filter_id) {
    if (perStudent.loading || loadStatus === "loading") {
      return (
        <div>
          <div className="pageTitle">Comunicados.</div>
          <div className="pageSub">Cargando…</div>
        </div>
      );
    }
    if (perStudent.error) {
      return (
        <div>
          <div className="pageTitle">Comunicados.</div>
          <div className="loginError" role="alert" style={{ marginTop: 16 }}>
            {perStudent.error}
          </div>
        </div>
      );
    }
    if (!perStudent.student) {
      return <Navigate to="/announcements" replace />;
    }
    const student = perStudent.student;
    const guardian_name = student.guardian_links[0]?.user.full_name ?? "—";
    const student_classroom = student.classroom;

    const q = alBuscador.trim().toLowerCase();
    const per_lista = announcements.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q)) return false;
      if (alFiltros.type && TYPE_LABEL[a.type] !== alFiltros.type) return false;
      return true;
    });

    const closeBack = () => {
      const to =
        back_origin === "alumnos"
          ? "/students"
          : back_origin === "aulas"
            ? "/classrooms"
            : "/announcements";
      setSearchParams({});
      navigate(to);
    };

    return (
      <div>
        <div className="pageTitle">Comunicados.</div>
        {(back_origin === "aulas" || back_origin === "alumnos") && (
          <button
            className="btnGhost"
            style={{ marginBottom: 14 }}
            onClick={closeBack}
          >
            ← Volver {back_origin === "alumnos" ? "a alumnos" : "al aula"}
          </button>
        )}
        <div className="alumnoStrip" style={{ marginBottom: 18 }}>
          <Avatar full_name={student.full_name} size={46} />
          <div>
            <div className="fichaName" style={{ fontSize: 18 }}>
              {student.full_name}
            </div>
            <div className="fichaSub">
              {student_classroom?.name ?? "—"} · Apoderado: {guardian_name}
            </div>
          </div>
        </div>

        <div className="obsFilters" style={{ marginBottom: 16 }}>
          <div className="searchBox searchBoxWide">
            <svg className="topSearchIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              className="input inputConIcono"
              placeholder="Buscar comunicado…"
              value={alBuscadorDraft}
              onChange={(e) => setAlBuscadorDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAlBuscador(alBuscadorDraft);
              }}
            />
          </div>
          <button
            className={"btnGhost btnIcon" + (activeAlFilterCount > 0 ? " filtroBtnOn" : "")}
            title="Filtrar"
            aria-label="Filtrar"
            onClick={() => {
              setAlFiltrosDraft(alFiltros);
              setAlFiltroPanel(true);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" />
            </svg>
            {activeAlFilterCount > 0 && (
              <span className="filtroBadge">{activeAlFilterCount}</span>
            )}
          </button>
          <button className="btn" onClick={() => openCreateForStudent(student)}>
            + Nuevo comunicado
          </button>
        </div>

        <div className="notebook">
          <div className="hojas">
            {per_lista.length === 0 ? (
              <div className="histEmpty">
                Todavía no hay comunicados para este alumno.
              </div>
            ) : (
              per_lista.map((a) => renderCard(a))
            )}
          </div>
        </div>

        {alFiltroPanel && (
          <div className="modalOverlay" onClick={() => setAlFiltroPanel(false)}>
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <div className="modalHead">
                <div className="fichaName" style={{ fontSize: 17 }}>
                  Filtrar comunicados
                </div>
                <button className="modalX" onClick={() => setAlFiltroPanel(false)} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="aulaLbl">Tipo</label>
                <select
                  className="input"
                  value={alFiltrosDraft.type}
                  onChange={(e) => setAlFiltrosDraft({ ...alFiltrosDraft, type: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option>Informativo</option>
                  <option>Autorización</option>
                </select>
              </div>
              <div className="modalActions" style={{ marginTop: 16 }}>
                <button className="btnGhost" onClick={() => setAlFiltrosDraft(PER_STUDENT_EMPTY)}>
                  Limpiar todo
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setAlFiltros(alFiltrosDraft);
                    setAlFiltroPanel(false);
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}

        {renderDrawer()}
        {renderCreateDrawer()}
      </div>
    );
  }

  // ─── LIST MODE ───────────────────────────────────────────────────────
  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Comunicados.</div>
        <div className="pageSub">Cargando comunicados…</div>
      </div>
    );
  }
  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Comunicados.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  const q = buscador.trim().toLowerCase();
  const filtered = announcements.filter((a) => {
    if (filtros.id_classroom) {
      if (a.scope === "individual") {
        // No easy way to resolve student → classroom without an extra fetch.
        // Approximation: if the classroom is not part of recipients, exclude.
        return false;
      }
      if (!recipientsClassrooms(a).includes(filtros.id_classroom as UUID))
        return false;
    }
    if (filtros.type) {
      const type_target = TYPE_FROM_LABEL[filtros.type];
      if (type_target && a.type !== type_target) return false;
    }
    if (filtros.scope && a.scope !== filtros.scope) return false;
    if (q) {
      const titleMatch = a.title.toLowerCase().includes(q);
      if (!titleMatch) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageAnns = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div>
      <div className="pageTitle">Comunicados.</div>
      <div className="pageSub">{announcements.length} en total</div>

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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" />
            </svg>
            Filtrar
            {activeFilterCount > 0 && (
              <span className="filtroBadge">{activeFilterCount}</span>
            )}
          </button>
          <button className="btn" onClick={() => openCreate(null)}>
            + Nuevo comunicado
          </button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="chipsBar">
          {filtros.id_classroom && (
            <span className="filtroChip">
              Aula:{" "}
              {classroomsById.get(filtros.id_classroom as UUID)?.name ?? "—"}{" "}
              <button onClick={() => setFiltros({ ...filtros, id_classroom: "" })}>✕</button>
            </span>
          )}
          {filtros.type && (
            <span className="filtroChip">
              Tipo: {filtros.type}{" "}
              <button onClick={() => setFiltros({ ...filtros, type: "" })}>✕</button>
            </span>
          )}
          {filtros.scope && (
            <span className="filtroChip">
              Alcance:{" "}
              {filtros.scope === "classroom"
                ? "Aula completa"
                : filtros.scope === "multi_classroom"
                  ? "Varias aulas"
                  : "Individual"}{" "}
              <button onClick={() => setFiltros({ ...filtros, scope: "" })}>✕</button>
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

      <div className="notebook">
        {filtered.length === 0 ? (
          <div className="histEmpty">
            Ningún comunicado coincide con los filtros.
          </div>
        ) : (
          <>
            <div className="hojas">
              {pageAnns.map((a) => renderCard(a))}
            </div>
            <Pagination
              page={currentPage}
              setPage={setPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </>
        )}
      </div>

      {filtroPanel && (
        <div className="modalOverlay" onClick={() => setFiltroPanel(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Filtros · Comunicados
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
                  {classrooms.map((c) => (
                    <option key={c.id_classroom} value={c.id_classroom}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Tipo</label>
              <select
                className="input"
                value={filtrosDraft.type}
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, type: e.target.value })}
              >
                <option value="">Todos</option>
                <option>Informativo</option>
                <option>Autorización</option>
              </select>
            </div>
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="aulaLbl">Alcance</label>
              <select
                className="input"
                value={filtrosDraft.scope}
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, scope: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="classroom">Aula completa</option>
                {!is_teacher && <option value="multi_classroom">Varias aulas</option>}
                <option value="individual">Individual</option>
              </select>
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button className="btnGhost" onClick={() => setFiltrosDraft(EMPTY_FILTERS)}>
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

      {renderDrawer()}
      {renderCreateDrawer()}
    </div>
  );

  // ─── Render helpers ─────────────────────────────────────────────────
  function renderCard(a: AnnouncementWithRelations) {
    const is_individual = a.scope === "individual";
    const targeted_names = recipientsClassrooms(a)
      .map((id) => classroomsById.get(id)?.name)
      .filter(Boolean);

    const alcance_tag =
      a.scope === "multi_classroom"
        ? `${targeted_names.length} aulas`
        : is_individual
          ? "Alumno"
          : targeted_names[0] ?? "Aula";

    return (
      <div
        key={a.id_announcement}
        className="hoja"
        onClick={() => {
          setVerId(a.id_announcement);
          setDetTab("info");
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="hojaHead">
          <div>
            <div className="hojaTitulo">{a.title}</div>
            <div className="hojaMeta">
              {formatDateLabel(a.created_at)} · {TYPE_LABEL[a.type]}
              <span className="alcanceTag">{alcance_tag}</span>
            </div>
          </div>
        </div>
        <div className="hojaBody">{a.content}</div>
      </div>
    );
  }

  function renderDrawer() {
    if (!ver_id) return null;

    return (
      <div className="drawerOverlay" onClick={() => setVerId(null)}>
        <div
          className="drawerCard drawerCardCol"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawerHead">
            <span className="modoIco modoIcoOn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fichaName" style={{ fontSize: 17 }}>
                {ver_detail?.title ?? "…"}
              </div>
              <div className="fichaSub" style={{ margin: 0 }}>
                {ver_detail ? TYPE_LABEL[ver_detail.type] : ""}
              </div>
            </div>
            <button
              className="modalX"
              onClick={() => setVerId(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="drawerTabs">
            <button
              className={"drawerTab" + (det_tab === "info" ? " drawerTabOn" : "")}
              onClick={() => setDetTab("info")}
            >
              Información
            </button>
            <button
              className={"drawerTab" + (det_tab === "estado" ? " drawerTabOn" : "")}
              onClick={() => setDetTab("estado")}
            >
              Estado
            </button>
          </div>

          <div className="drawerBody">
            {ver_status === "loading" && (
              <div className="hintSmall">Cargando…</div>
            )}
            {ver_status === "error" && (
              <div className="loginError" role="alert">{ver_error}</div>
            )}
            {ver_status === "ready" && ver_detail && det_tab === "info" && (
              <>
                <div className="detGrid">
                  <div className="detCell">
                    <span className="detLbl">Fecha</span>
                    <span className="detVal">
                      {formatDateLabel(ver_detail.created_at)}
                    </span>
                  </div>
                  <div className="detCell">
                    <span className="detLbl">Tipo</span>
                    <span className="detVal">{TYPE_LABEL[ver_detail.type]}</span>
                  </div>
                  <div className="detCell">
                    <span className="detLbl">Alcance</span>
                    <span className="detVal">
                      {ver_detail.scope === "individual"
                        ? "Individual"
                        : ver_detail.scope === "multi_classroom"
                          ? "Varias aulas"
                          : ver_detail.scope === "school_wide"
                            ? "Colegio completo"
                            : "Aula completa"}
                    </span>
                  </div>
                  <div className="detCell">
                    <span className="detLbl">Autor</span>
                    <span className="detVal">
                      {ver_detail.author.full_name}
                    </span>
                  </div>
                </div>

                {ver_detail.type === "authorization" && (
                  <div className="noteWarn" style={{ marginTop: 16 }}>
                    Requiere firma de la familia para considerarse recibido.
                  </div>
                )}

                <div className="drawerLbl">Mensaje</div>
                <div className="detMensaje">{ver_detail.content}</div>
              </>
            )}

            {ver_status === "ready" && ver_detail && det_tab === "estado" && (
              <>
                {status_state === "loading" && (
                  <div className="hintSmall">Cargando estado…</div>
                )}
                {status_state === "error" && (
                  <div className="loginError" role="alert">
                    {status_error}
                  </div>
                )}
                {status_state === "ready" && (
                  <>
                    {(() => {
                      const is_auth =
                        ver_detail.type === "authorization";
                      const total = status_rows.length;
                      const done = status_rows.filter((r) =>
                        is_auth ? r.confirmed_at : r.read_at,
                      ).length;
                      const pending = total - done;
                      return (
                        <>
                          <div className="detResumen">
                            <div className="detResItem">
                              <strong>{done}</strong>
                              <span>
                                {is_auth ? "firmaron" : "leyeron"}
                              </span>
                            </div>
                            <div className="detResItem">
                              <strong>{pending}</strong>
                              <span>pendientes</span>
                            </div>
                            <div className="detResItem">
                              <strong>{total}</strong>
                              <span>destinatarios</span>
                            </div>
                          </div>

                          {total === 0 ? (
                            <div
                              className="hintSmall"
                              style={{ marginTop: 12 }}
                            >
                              No hay apoderados asignados a los destinatarios
                              de este comunicado.
                            </div>
                          ) : (
                            <ul
                              className="statusRoster"
                              style={{
                                marginTop: 14,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                padding: 0,
                                listStyle: "none",
                              }}
                            >
                              {status_rows.map((r) => {
                                const ts = is_auth
                                  ? r.confirmed_at
                                  : r.read_at;
                                const label = ts
                                  ? is_auth
                                    ? "Firmado"
                                    : "Leído"
                                  : is_auth
                                    ? "Pendiente de firma"
                                    : "No leído";
                                const tone = ts ? "green" : "amber";
                                return (
                                  <li
                                    key={
                                      r.id_user +
                                      "-" +
                                      (r.id_student ?? "none")
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      padding: "8px 10px",
                                      border: "1px solid #eee",
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Avatar
                                      full_name={r.full_name}
                                      size={32}
                                    />
                                    <div
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <div
                                        className="fichaName"
                                        style={{ fontSize: 14 }}
                                      >
                                        {r.full_name}
                                      </div>
                                      <div
                                        className="fichaSub"
                                        style={{ margin: 0 }}
                                      >
                                        {r.student_name
                                          ? `Apoderado de ${r.student_name}`
                                          : "Apoderado"}
                                        {ts
                                          ? ` · ${new Date(ts).toLocaleString(
                                              "es-PE",
                                              {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              },
                                            )}`
                                          : ""}
                                      </div>
                                    </div>
                                    <Chip tone={tone}>{label}</Chip>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </div>

          <div className="drawerPie">
            <button className="btnGhost" onClick={() => setVerId(null)}>
              Cerrar
            </button>
            {ver_detail && (
              <button
                className="btn"
                onClick={() => {
                  setVerId(null);
                  openCreate(ver_detail);
                }}
              >
                Editar comunicado
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCreateDrawer() {
    if (!create_drawer_open) return null;
    const isEditing = !!edit_id;
    const isPerStudent = !!student_filter_id && !isEditing;
    const target = isPerStudent ? perStudent.student : null;
    const showCards = !isEditing;
    const showFormFields =
      isEditing ||
      create_mode === "manual" ||
      (create_mode === "voz" && voice.mode === "ready");
    const headTitle = isEditing ? "Editar comunicado" : "Nuevo comunicado";
    const headerSub = target
      ? `${target.full_name} · ${target.classroom?.name ?? "—"}`
      : isEditing
        ? "Editar contenido del comunicado"
        : "Elige cómo quieres redactarlo";
    const headIcon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
      </svg>
    );
    return (
      <div className="drawerOverlay" onClick={closeCreateDrawer}>
        <div
          className="drawerCard drawerCardCol"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawerHead">
            <span className="modoIco modoIcoOn">{headIcon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fichaName" style={{ fontSize: 17 }}>
                {headTitle}
              </div>
              <div className="fichaSub" style={{ margin: 0 }}>
                {headerSub}
              </div>
            </div>
            <button
              className="modalX"
              onClick={closeCreateDrawer}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="drawerBody">
            {showCards && (
              <div className="modoGrid">
                <button
                  className={
                    "modoCard" + (create_mode === "voz" ? " modoCardOn" : "")
                  }
                  onClick={() => setCreateMode("voz")}
                >
                  <span
                    className={
                      "modoIco" + (create_mode === "voz" ? " modoIcoOn" : "")
                    }
                  >
                    {MIC_ICON}
                  </span>
                  <span className="modoTxt">
                    <strong>Con voz o prompt</strong>
                    <span>
                      Dicta o escribe suelto; la IA arma el borrador de título,
                      mensaje y tipo.
                    </span>
                  </span>
                </button>
                <button
                  className={
                    "modoCard" + (create_mode === "manual" ? " modoCardOn" : "")
                  }
                  onClick={() => setCreateMode("manual")}
                >
                  <span
                    className={
                      "modoIco" + (create_mode === "manual" ? " modoIcoOn" : "")
                    }
                  >
                    {PEN_ICON}
                  </span>
                  <span className="modoTxt">
                    <strong>Manualmente</strong>
                    <span>
                      Redactas el comunicado tú y eliges tipo y destinatarios.
                    </span>
                  </span>
                </button>
              </div>
            )}

            {isEditing && (
              <div className="hintSmall" style={{ marginBottom: 8 }}>
                Al editar solo puedes cambiar título y contenido. Tipo, alcance
                y destinatarios quedan fijos.
              </div>
            )}

            {create_mode === "voz" && (
              <>
                <div className="drawerLbl">
                  Dicta o describe lo que quieres comunicar
                </div>
                <textarea
                  className="draftArea"
                  rows={8}
                  placeholder="Ej.: salida al Parque de las Leyendas el viernes 20, requiere autorización y S/ 15"
                  value={voice.transcript}
                  onChange={(e) =>
                    setVoice(
                      voice.mode === "ready"
                        ? { mode: "idle", transcript: e.target.value }
                        : { ...voice, transcript: e.target.value },
                    )
                  }
                  disabled={
                    voice.mode === "listening" || voice.mode === "processing"
                  }
                  autoFocus
                />
                <div
                  className="voiceRow"
                  style={{ marginTop: 10, alignItems: "center" }}
                >
                  <MicButton
                    onClick={dictarVoz}
                    active={voice.mode === "listening"}
                    disabled={
                      voice.mode === "listening" ||
                      voice.mode === "processing"
                    }
                    label="Dictar comunicado por voz"
                  />
                  <button
                    className="btn"
                    onClick={generarBorrador}
                    disabled={
                      !voice.transcript.trim() ||
                      voice.mode === "listening" ||
                      voice.mode === "processing"
                    }
                  >
                    ✦ Generar borrador
                  </button>
                  <div className="voiceRowText">
                    {voice.mode === "listening" && (
                      <VoiceDots>Escuchando… dicta el comunicado.</VoiceDots>
                    )}
                    {voice.mode === "processing" && (
                      <VoiceDots>Interpretando y armando el borrador…</VoiceDots>
                    )}
                    {voice.mode === "ready" && (
                      <span className="draftBadge" style={{ margin: 0 }}>
                        Borrador generado — revisa y edita antes de publicar
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {showFormFields && <>
            <div className="drawerLbl">Título</div>
            <input
              className="input"
              placeholder="Título (ej.: Salida al Parque de las Leyendas)"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              autoFocus
            />

            <div className="drawerLbl">Mensaje</div>
            <textarea
              className="draftArea"
              rows={5}
              placeholder="Detalle: fecha, hora, indicaciones…"
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />

            {!isPerStudent && (
              <>
                <div className="drawerLbl">Destinatario</div>
                <div className="radioRow">
                  <label
                    className={
                      "radioPill" +
                      (draft.scope === "classroom" ? " radioOn" : "")
                    }
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={draft.scope === "classroom"}
                      disabled={isEditing}
                      onChange={() => setDraft({ ...draft, scope: "classroom" })}
                    />
                    Para toda el aula
                  </label>
                  {!is_teacher && (
                    <label
                      className={
                        "radioPill" +
                        (draft.scope === "multi_classroom" ? " radioOn" : "")
                      }
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={draft.scope === "multi_classroom"}
                        disabled={isEditing}
                        onChange={() =>
                          setDraft({ ...draft, scope: "multi_classroom" })
                        }
                      />
                      Varias aulas
                    </label>
                  )}
                  <label
                    className={
                      "radioPill" +
                      (draft.scope === "individual" ? " radioOn" : "")
                    }
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={draft.scope === "individual"}
                      disabled={isEditing}
                      onChange={() =>
                        setDraft({ ...draft, scope: "individual" })
                      }
                    />
                    Para un alumno
                  </label>
                </div>

                {draft.scope === "individual" && (
                  <>
                    <div className="drawerLbl">Alumno</div>
                    <select
                      className="input"
                      value={draft.id_student_target}
                      disabled={isEditing}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          id_student_target: e.target.value as UUID,
                        })
                      }
                    >
                      <option value="">Selecciona un alumno</option>
                      {rosterForContext.map((s) => (
                        <option key={s.id_student} value={s.id_student}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                    {rosterForContext.length === 0 && !isEditing && (
                      <div className="hintSmall">
                        No hay alumnos en el aula de contexto.
                      </div>
                    )}
                  </>
                )}

                {draft.scope === "multi_classroom" && (
                  <>
                    <div className="drawerLbl">Aulas</div>
                    <div className="radioRow" style={{ flexWrap: "wrap" }}>
                      {classrooms.map((c) => {
                        const on = draft.id_classrooms_target.includes(
                          c.id_classroom,
                        );
                        return (
                          <label
                            key={c.id_classroom}
                            className={"radioPill" + (on ? " radioOn" : "")}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={isEditing}
                              onChange={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  id_classrooms_target: on
                                    ? prev.id_classrooms_target.filter(
                                        (id) => id !== c.id_classroom,
                                      )
                                    : [
                                        ...prev.id_classrooms_target,
                                        c.id_classroom,
                                      ],
                                }))
                              }
                            />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="drawerLbl">Tipo</div>
            <select
              className="input"
              value={draft.type}
              disabled={isEditing}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  type: e.target.value as AnnouncementType,
                })
              }
            >
              <option value="informative">Informativo</option>
              <option value="authorization">Autorización</option>
            </select>

            {saveError && (
              <div className="loginError" role="alert" style={{ marginTop: 12 }}>
                {saveError}
              </div>
            )}
            </>}
          </div>

          {showFormFields && (
            <div className="drawerPie">
              <button
                className="btnGhost"
                onClick={closeCreateDrawer}
                disabled={saving}
              >
                Cancelar
              </button>
              <button className="btn" onClick={publish} disabled={saving}>
                {saving
                  ? "Guardando…"
                  : isEditing
                    ? "Guardar cambios"
                    : "Publicar"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
