import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/Card";
import { Chip, type ChipTone } from "@/components/Chip";
import { CompetencyIcon, type CompetencyTone } from "@/components/CompetencyIcon";
import { VoiceDots } from "@/components/VoiceDots";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/contexts/ToastContext";
import { VOICE_SAMPLES_OBSERVATION } from "@/data/voiceSamples";
import { pickRandom } from "@/lib/random";
import { capitalizeSentence, firstName } from "@/lib/text";
import { ApiError } from "@/lib/api";
import { attendanceForStudent } from "@/lib/api/attendance";
import { listCompetencies } from "@/lib/api/competencies";
import {
  competencyProfileForStudent,
  type AttendanceLabel,
  type CompetencyLabel,
} from "@/lib/api/competencyProfile";
import {
  confirmConclusion,
  conclusionsForStudent,
  generateConclusion,
  type DescriptiveConclusionWithConfirmer,
} from "@/lib/api/descriptiveConclusions";
import {
  createObservation,
  generateObservationDraft,
  observationsForStudent,
  type ObservationWithRelations,
} from "@/lib/api/observations";
import { getStudent, listStudents } from "@/lib/api/students";
import { listSubjects } from "@/lib/api/subjects";
import type {
  Competency,
  Student,
  Subject,
  UUID,
} from "@/types/domain";

// Not in CONTRACT §12 — Competency stores only id + name. Tones/short labels
// are UI-only. Backend seeds these seven names (see MINEDU_COMPETENCIES).
const COMPETENCY_TONE: Record<string, CompetencyTone> = {
  Convivencia: "green",
  Identidad: "amber",
  "Resuelve problemas": "pen",
  Comunicación: "pen",
  Indaga: "green",
  Creatividad: "pen",
  Motricidad: "pen",
};

const LABEL_LABEL: Record<CompetencyLabel["label"], string> = {
  fortaleza: "Fortaleza",
  reforzando: "Reforzando",
  en_desarrollo: "En desarrollo",
};

const LABEL_TONE: Record<CompetencyLabel["label"], ChipTone> = {
  fortaleza: "green",
  reforzando: "amber",
  en_desarrollo: "pen",
};

const ATTENDANCE_LABEL_ES: Record<string, string> = {
  puntual: "Puntual",
  tardanzas_ocasionales: "Tardanzas ocasionales",
  tardanzas_frecuentes: "Tardanzas frecuentes",
  asistencia_constante: "Asistencia constante",
  faltas_ocasionales: "Faltas ocasionales",
  faltas_frecuentes: "Faltas frecuentes",
  buena_adaptacion: "Buena adaptación",
  necesita_seguimiento: "Necesita seguimiento",
};

const ATTENDANCE_TYPE_ES: Record<string, string> = {
  punctuality: "Puntualidad",
  consistency: "Constancia",
  adaptation: "Adaptación",
};

function attendanceLabelTone(l: AttendanceLabel): ChipTone {
  if (l.label.includes("frecuentes") || l.label === "necesita_seguimiento")
    return "red";
  if (l.label.includes("ocasionales")) return "amber";
  return "green";
}

type Ta = "timeline" | "conclusiones";
type DrawerMode = "voz" | "manual" | null;

interface VoiceDraft {
  id_competency: UUID | "";
  id_subject: UUID | "";
  text: string;
}

type VoiceState =
  | { mode: "idle"; transcript: string }
  | { mode: "listening"; transcript: string }
  | { mode: "processing"; transcript: string }
  | { mode: "ready"; transcript: string; draft: VoiceDraft };

// Backend names are already short — use them as `short_label` directly.
function shortLabelFor(competency_name: string | null | undefined): string {
  return competency_name ?? "";
}

function toneFor(competency_name: string | null | undefined): CompetencyTone {
  if (!competency_name) return "pen";
  return COMPETENCY_TONE[competency_name] ?? "pen";
}

function chipToneFor(competency_name: string | null | undefined): ChipTone {
  const tone = toneFor(competency_name);
  return (tone as ChipTone);
}

function formatWhenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `Hoy · ${d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

function firstDayOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
const SEARCH_ICON = (
  <svg className="topSearchIcon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);
const MIC_MINI_ICON = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
    <path d="M6 11a6 6 0 0 0 12 0" />
  </svg>
);
const FILTER_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" />
  </svg>
);
const CONCL_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h5" />
  </svg>
);
const SPARK_ICON = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.09 5.91L20 10l-5.91 2.09L12 18l-2.09-5.91L4 10l5.91-2.09L12 2z" />
  </svg>
);

export default function StudentProfilePage() {
  const { session } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [search_params] = useSearchParams();
  const { id_student: id_student_param } = useParams<{ id_student: UUID }>();
  const origen = search_params.get("from");

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (!id_student_param) return <Navigate to="/students" replace />;

  const id_school = session.id_school;
  const is_teacher = session.role === "teacher";

  // ── Data ────────────────────────────────────────────────────────────
  const [student, setStudent] = useState<Awaited<
    ReturnType<typeof getStudent>
  > | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [observations, setObservations] = useState<ObservationWithRelations[]>(
    [],
  );
  const [profile, setProfile] = useState<{
    competency_labels: CompetencyLabel[];
    attendance_labels: AttendanceLabel[];
  } | null>(null);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const [monthAbsences, setMonthAbsences] = useState<number>(0);
  const [conclusions, setConclusions] = useState<
    DescriptiveConclusionWithConfirmer[]
  >([]);

  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "not_found" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");

  const [ficha_tab, setFichaTab] = useState<Ta>("timeline");

  // Observation list filters
  const [obs_buscador, setObsBuscador] = useState("");
  const [obs_comp, setObsComp] = useState("");

  // Observation drawer
  const [obs_drawer, setObsDrawer] = useState<DrawerMode>(null);
  const [voice, setVoice] = useState<VoiceState>({ mode: "idle", transcript: "" });
  const [obs_manual_competency, setObsManualCompetency] = useState<UUID | "">("");
  const [obs_manual_subject, setObsManualSubject] = useState<UUID | "">("");
  const [obs_manual_text, setObsManualText] = useState("");
  const [obsSaving, setObsSaving] = useState(false);
  const [obsError, setObsError] = useState("");

  // Conclusion assistant
  const [conclusion, setConclusion] = useState("");
  const [conclusionState, setConclusionState] = useState<
    "idle" | "loading" | "ready" | "saving"
  >("idle");
  const [conclusionError, setConclusionError] = useState("");
  const [conclusionBasedOn, setConclusionBasedOn] = useState<number | null>(null);
  const [conclusionDrawer, setConclusionDrawer] = useState(false);
  const [conclBuscador, setConclBuscador] = useState("");
  const [conclFiltroPanel, setConclFiltroPanel] = useState(false);
  const [conclDateFrom, setConclDateFrom] = useState("");
  const [conclDateTo, setConclDateTo] = useState("");
  const [conclDateFromDraft, setConclDateFromDraft] = useState("");
  const [conclDateToDraft, setConclDateToDraft] = useState("");

  useEffect(() => {
    setConclusion("");
    setConclusionState("idle");
    setConclusionError("");
    setConclusionBasedOn(null);
    setConclusionDrawer(false);
    setConclBuscador("");
    setConclFiltroPanel(false);
    setConclDateFrom("");
    setConclDateTo("");
  }, [id_student_param]);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    setLoadError("");

    async function loadTeacherRoster(): Promise<Student[]> {
      if (!is_teacher) return [];
      try {
        // Backend ya filtra /students por aulas del docente (StudentService.findAll).
        return await listStudents({ id_school });
      } catch {
        return [];
      }
    }

    async function load() {
      try {
        // Student first — if it 404s, bail out.
        const detail = await getStudent(id_student_param!, { id_school });
        if (cancelled) return;
        setStudent(detail);

        // Everything else in parallel; individual failures degrade instead of
        // killing the whole page (e.g. competency-profile module disabled).
        const from_iso = firstDayOfMonthIso();
        const to_iso = todayIso();
        const [
          catalog,
          subjectCatalog,
          obs,
          profileRes,
          attendance,
          concs,
          teacherRoster,
        ] = await Promise.all([
          listCompetencies().catch(() => [] as Competency[]),
          listSubjects({ id_school }).catch(() => [] as Subject[]),
          observationsForStudent(id_student_param!).catch(
            () => [] as ObservationWithRelations[],
          ),
          competencyProfileForStudent(id_student_param!)
            .then((p) => ({ ok: true as const, value: p }))
            .catch((err) => ({ ok: false as const, err })),
          attendanceForStudent(id_student_param!, {
            from: from_iso,
            to: to_iso,
          }).catch(() => []),
          conclusionsForStudent(id_student_param!).catch(
            () => [] as DescriptiveConclusionWithConfirmer[],
          ),
          loadTeacherRoster(),
        ]);
        if (cancelled) return;

        setCompetencies(catalog);
        setSubjects(subjectCatalog);
        setObservations(obs);
        if (profileRes.ok) {
          setProfile({
            competency_labels: profileRes.value.competency_labels,
            attendance_labels: profileRes.value.attendance_labels,
          });
          setProfileUnavailable(false);
        } else {
          setProfile(null);
          setProfileUnavailable(true);
        }
        setMonthAbsences(
          attendance.filter((a) => a.status === "absent").length,
        );
        setConclusions(concs);
        setRoster(teacherRoster);
        setLoadStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setLoadStatus("not_found");
          return;
        }
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la ficha del alumno.",
        );
        setLoadStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id_student_param, id_school, is_teacher]);

  const goBack = () => {
    const to = origen === "alumnos" ? "/students" : "/classrooms";
    navigate(to);
  };

  const selectStudent = (id: UUID) => {
    navigate(`/students/${id}` + (origen ? `?from=${origen}` : ""));
  };

  const openVoiceDrawer = () => {
    setObsDrawer("voz");
    setVoice({ mode: "idle", transcript: "" });
    setObsError("");
  };

  const openManualDrawer = () => {
    setObsDrawer("manual");
    setObsManualCompetency("");
    setObsManualSubject("");
    setObsManualText("");
    setObsError("");
  };

  const closeDrawer = () => {
    setObsDrawer(null);
    setVoice({ mode: "idle", transcript: "" });
    setObsError("");
  };

  const openConclusionDrawer = () => {
    setConclusion("");
    setConclusionState("idle");
    setConclusionError("");
    setConclusionBasedOn(null);
    setConclusionDrawer(true);
  };

  const closeConclusionDrawer = () => {
    setConclusionDrawer(false);
  };

  const openConclFilters = () => {
    setConclDateFromDraft(conclDateFrom);
    setConclDateToDraft(conclDateTo);
    setConclFiltroPanel(true);
  };

  const requestDraftFromApi = async (transcript: string, source: "voice" | "text") => {
    setVoice({ mode: "processing", transcript });
    setObsError("");
    try {
      const res = await generateObservationDraft({
        id_student: id_student_param!,
        transcript,
        source,
      });
      setVoice({
        mode: "ready",
        transcript,
        draft: {
          id_competency: (res.id_competency ?? "") as UUID | "",
          id_subject: (res.id_subject ?? "") as UUID | "",
          text: res.draft || capitalizeSentence(transcript),
        },
      });
    } catch (err) {
      setVoice({ mode: "idle", transcript });
      setObsError(
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el borrador. Reintenta.",
      );
    }
  };

  const dictarVoz = () => {
    // Mock STT: cargamos un sample tras un breve delay para simular el dictado.
    // La generación del borrador (limpieza + clasificación) es real vía IA.
    setVoice({ mode: "listening", transcript: "" });
    const sample = pickRandom(VOICE_SAMPLES_OBSERVATION);
    window.setTimeout(() => {
      void requestDraftFromApi(sample, "voice");
    }, 1600);
  };

  const generarBorrador = () => {
    if (voice.mode !== "idle" && voice.mode !== "processing") return;
    const transcript = voice.transcript.trim();
    if (!transcript) return;
    void requestDraftFromApi(transcript, "text");
  };

  const refetchObservations = async () => {
    try {
      const [obs, prof] = await Promise.all([
        observationsForStudent(id_student_param!),
        profileUnavailable
          ? Promise.resolve(null)
          : competencyProfileForStudent(id_student_param!).catch(() => null),
      ]);
      setObservations(obs);
      if (prof) {
        setProfile({
          competency_labels: prof.competency_labels,
          attendance_labels: prof.attendance_labels,
        });
      }
    } catch {
      // best-effort refresh
    }
  };

  const guardarObsVoz = async () => {
    if (voice.mode !== "ready" || obsSaving) return;
    if (!voice.draft.id_competency) {
      setObsError("Selecciona una competencia antes de guardar.");
      return;
    }
    setObsSaving(true);
    setObsError("");
    try {
      await createObservation({
        id_student: id_student_param!,
        id_competency: voice.draft.id_competency,
        id_subject: voice.draft.id_subject || null,
        content: voice.draft.text.trim(),
        source: "voice",
      });
      await refetchObservations();
      showToast("Observación registrada ✓");
      closeDrawer();
    } catch (err) {
      setObsError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la observación.",
      );
    } finally {
      setObsSaving(false);
    }
  };

  const guardarObsManual = async () => {
    if (obsSaving) return;
    if (!obs_manual_text.trim()) {
      setObsError("Escribe la observación.");
      return;
    }
    if (!obs_manual_competency) {
      setObsError("Selecciona una competencia.");
      return;
    }
    setObsSaving(true);
    setObsError("");
    try {
      await createObservation({
        id_student: id_student_param!,
        id_competency: obs_manual_competency,
        id_subject: obs_manual_subject || null,
        content: obs_manual_text.trim(),
        source: "text",
      });
      await refetchObservations();
      showToast("Observación registrada ✓");
      closeDrawer();
    } catch (err) {
      setObsError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la observación.",
      );
    } finally {
      setObsSaving(false);
    }
  };

  const runGenerateConclusion = async () => {
    setConclusionState("loading");
    setConclusion("");
    setConclusionError("");
    setConclusionBasedOn(null);
    try {
      const res = await generateConclusion(id_student_param!);
      setConclusion(res.draft);
      setConclusionBasedOn(res.based_on);
      setConclusionState("ready");
    } catch (err) {
      setConclusionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el borrador.",
      );
      setConclusionState("idle");
    }
  };

  const runConfirmConclusion = async () => {
    if (!conclusion.trim()) return;
    setConclusionState("saving");
    setConclusionError("");
    try {
      await confirmConclusion(id_student_param!, conclusion.trim());
      const list = await conclusionsForStudent(id_student_param!);
      setConclusions(list);
      setConclusion("");
      setConclusionBasedOn(null);
      setConclusionState("idle");
      setConclusionDrawer(false);
    } catch (err) {
      setConclusionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la conclusión.",
      );
      setConclusionState("ready");
    }
  };

  const competenciasEnLista = useMemo(() => {
    const set = new Set<string>();
    for (const o of observations) set.add(o.competency.name);
    return Array.from(set);
  }, [observations]);

  const observacionesFiltradas = useMemo(() => {
    const q = obs_buscador.trim().toLowerCase();
    return observations.filter((o) => {
      if (
        q &&
        !(
          o.content.toLowerCase().includes(q) ||
          o.competency.name.toLowerCase().includes(q)
        )
      )
        return false;
      if (obs_comp && o.competency.name !== obs_comp) return false;
      return true;
    });
  }, [observations, obs_buscador, obs_comp]);

  const conclusionesFiltradas = useMemo(() => {
    const q = conclBuscador.trim().toLowerCase();
    const from = conclDateFrom ? new Date(conclDateFrom).getTime() : null;
    const to = conclDateTo ? new Date(conclDateTo).getTime() + 86_400_000 : null;
    return conclusions.filter((c) => {
      if (
        q &&
        !(
          c.content.toLowerCase().includes(q) ||
          c.confirmer.full_name.toLowerCase().includes(q)
        )
      )
        return false;
      if (from || to) {
        const t = new Date(c.generated_at).getTime();
        if (from && t < from) return false;
        if (to && t >= to) return false;
      }
      return true;
    });
  }, [conclusions, conclBuscador, conclDateFrom, conclDateTo]);

  const activeConclFilterCount =
    (conclDateFrom ? 1 : 0) + (conclDateTo ? 1 : 0);

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Ficha del alumno.</div>
        <div className="pageSub">Cargando…</div>
      </div>
    );
  }

  if (loadStatus === "not_found") {
    return <Navigate to="/students" replace />;
  }

  if (loadStatus === "error" || !student) {
    return (
      <div>
        <div className="pageTitle">Ficha del alumno.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  const classroom_name = student.classroom?.name ?? "Sin aula";
  const guardian_name = student.guardian_links[0]?.user.full_name ?? "—";

  return (
    <div>
      <div className="crumbs">
        {is_teacher ? (
          <>
            <span>{classroom_name}</span>
            <span>/</span>
            <select
              className="input"
              style={{ maxWidth: 230, height: 34, padding: "4px 10px" }}
              value={student.id_student}
              onChange={(e) => selectStudent(e.target.value as UUID)}
              aria-label="Elegir alumno"
            >
              {roster.map((s) => (
                <option key={s.id_student} value={s.id_student}>
                  {s.full_name}
                </option>
              ))}
              {roster.every((s) => s.id_student !== student.id_student) && (
                <option value={student.id_student}>{student.full_name}</option>
              )}
            </select>
          </>
        ) : (
          <>
            <button onClick={goBack}>
              {origen === "alumnos" ? "Alumnos" : classroom_name}
            </button>
            <span>/</span>
            <span className="crumbsNow">{student.full_name}</span>
          </>
        )}
      </div>

      <div className="pageTitle">{student.full_name}.</div>
      <div className="pageSub">
        {classroom_name} · Apoderado: {guardian_name} · {monthAbsences} faltas
        este mes
      </div>

      <div className="fichaTabs">
        <button
          className={"fichaTab" + (ficha_tab === "timeline" ? " fichaTabOn" : "")}
          onClick={() => setFichaTab("timeline")}
        >
          Línea de tiempo{" "}
          <span className="fichaTabNum">{observations.length}</span>
        </button>
        <button
          className={
            "fichaTab" + (ficha_tab === "conclusiones" ? " fichaTabOn" : "")
          }
          onClick={() => setFichaTab("conclusiones")}
        >
          Conclusiones descriptivas{" "}
          <span className="fichaTabNum">{conclusions.length}</span>
        </button>
      </div>

      {ficha_tab === "timeline" ? (
        <>
          <div
            className="obsFilters"
            style={{
              width: "100%",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div className="searchBox searchBoxWide" style={{ flex: 1 }}>
              {SEARCH_ICON}
              <input
                className="input inputConIcono"
                placeholder="Buscar en las observaciones"
                value={obs_buscador}
                onChange={(e) => setObsBuscador(e.target.value)}
              />
            </div>
            <select
              className="input"
              value={obs_comp}
              onChange={(e) => setObsComp(e.target.value)}
            >
              <option value="">Toda competencia</option>
              {competenciasEnLista.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              className="btn"
              onClick={openVoiceDrawer}
              style={{ marginLeft: "auto" }}
            >
              + Nueva observación
            </button>
          </div>

        <div className="fichaGrid">
          <div className="fichaCol">
            <Card className="cardFlush">
              <div className="obsCount">
                {observacionesFiltradas.length}{" "}
                {observacionesFiltradas.length === 1
                  ? "observación"
                  : "observaciones"}
              </div>
              {observacionesFiltradas.length === 0 ? (
                <div className="histEmpty">
                  {observations.length === 0
                    ? "Todavía no hay observaciones para este alumno."
                    : "Ninguna observación coincide con los filtros."}
                </div>
              ) : (
                observacionesFiltradas.map((o) => {
                  const tone = toneFor(o.competency.name);
                  const chip_tone = chipToneFor(o.competency.name);
                  const isVoice = o.source === "voice";
                  return (
                    <div key={o.id_observation} className="obsItem">
                      <CompetencyIcon tone={tone} />
                      <div className="obsBody">
                        <div className="obsMeta">
                          <span className="obsFecha">
                            {formatWhenLabel(o.created_at)}
                          </span>
                          <Chip tone={chip_tone}>{o.competency.name}</Chip>
                          {isVoice && (
                            <span className="obsVoz">
                              {MIC_MINI_ICON}
                              voz
                            </span>
                          )}
                        </div>
                        <div className="obsTexto">{o.content}</div>
                        <div className="hintSmall">
                          Por {o.author.full_name}
                          {o.subject ? ` · ${o.subject.name}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          <Card>
            <div className="fichaName" style={{ fontSize: 16, marginBottom: 14 }}>
              Perfil de avance
            </div>

            {profileUnavailable ? (
              <div className="hintSmall">
                El perfil de avance no está disponible: el colegio no tiene el
                módulo activo.
              </div>
            ) : profile ? (
              <>
                <div className="cardEyebrow">Competencias</div>
                {profile.competency_labels.length === 0 ? (
                  <div className="hintSmall">
                    Aún no hay observaciones suficientes para derivar
                    competencias.
                  </div>
                ) : (
                  <div className="perfilList">
                    {profile.competency_labels.map((l) => (
                      <div key={l.competency} className="perfilRow">
                        <CompetencyIcon tone={toneFor(l.competency)} />
                        <span style={{ flex: 1 }}>{l.competency}</span>
                        <Chip tone={LABEL_TONE[l.label]}>
                          {LABEL_LABEL[l.label]}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cardEyebrow" style={{ marginTop: 18 }}>
                  Patrón de asistencia
                </div>
                {profile.attendance_labels.length === 0 ? (
                  <div className="hintSmall">
                    Todavía no hay registros de asistencia suficientes.
                  </div>
                ) : (
                  <div className="perfilList">
                    {profile.attendance_labels.map((l) => (
                      <div key={l.type} className="perfilRow">
                        <span style={{ flex: 1 }}>
                          {ATTENDANCE_TYPE_ES[l.type] ?? l.type}
                        </span>
                        <Chip tone={attendanceLabelTone(l)}>
                          {ATTENDANCE_LABEL_ES[l.label] ?? l.label}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
                <div className="hintSmall" style={{ marginTop: 14 }}>
                  Se recalcula con cada observación nueva. Visible siempre para
                  la familia.
                </div>
              </>
            ) : (
              <div className="hintSmall">Cargando perfil…</div>
            )}
          </Card>
        </div>
        </>
      ) : (
        <>
          <div
            className="obsFilters"
            style={{
              width: "100%",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div className="searchBox searchBoxWide" style={{ flex: 1 }}>
              {SEARCH_ICON}
              <input
                className="input inputConIcono"
                placeholder="Buscar en las conclusiones"
                value={conclBuscador}
                onChange={(e) => setConclBuscador(e.target.value)}
              />
            </div>
            <button
              className={
                "btnGhost btnIcon" +
                (activeConclFilterCount > 0 ? " filtroBtnOn" : "")
              }
              title="Filtrar"
              aria-label="Filtrar"
              onClick={openConclFilters}
            >
              {FILTER_ICON}
              {activeConclFilterCount > 0 && (
                <span className="filtroBadge">{activeConclFilterCount}</span>
              )}
            </button>
            <button
              className="btn"
              onClick={openConclusionDrawer}
              style={{ marginLeft: "auto" }}
            >
              + Nueva conclusión
            </button>
          </div>

          <Card className="cardFlush">
            <div className="obsCount">
              {conclusionesFiltradas.length}{" "}
              {conclusionesFiltradas.length === 1
                ? "conclusión"
                : "conclusiones"}
            </div>
            {conclusionesFiltradas.length === 0 ? (
              <div className="histEmpty">
                {conclusions.length === 0
                  ? "Todavía no hay conclusiones para este alumno."
                  : "Ninguna conclusión coincide con los filtros."}
              </div>
            ) : (
              conclusionesFiltradas.map((c) => (
                <div key={c.id_descriptive_conclusion} className="conclItem">
                  <span className="conclIco">{CONCL_ICON}</span>
                  <div className="conclBody">
                    <div className="conclMeta">
                      <span className="conclFecha">
                        {formatWhenLabel(c.generated_at)}
                      </span>
                      <span className="conclChip">
                        {SPARK_ICON}
                        IA · Revisada
                      </span>
                    </div>
                    <div className="conclTexto">{c.content}</div>
                    <div className="conclFoot">
                      Confirmada por{" "}
                      <strong>{c.confirmer.full_name}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </>
      )}

      {conclFiltroPanel && (
        <div
          className="modalOverlay"
          onClick={() => setConclFiltroPanel(false)}
        >
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Filtrar conclusiones
              </div>
              <button
                className="modalX"
                onClick={() => setConclFiltroPanel(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <label className="aulaLbl">Desde</label>
              <input
                type="date"
                className="input"
                value={conclDateFromDraft}
                onChange={(e) => setConclDateFromDraft(e.target.value)}
              />
            </div>
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <label className="aulaLbl">Hasta</label>
              <input
                type="date"
                className="input"
                value={conclDateToDraft}
                onChange={(e) => setConclDateToDraft(e.target.value)}
              />
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button
                className="btnGhost"
                onClick={() => {
                  setConclDateFromDraft("");
                  setConclDateToDraft("");
                }}
              >
                Limpiar todo
              </button>
              <button
                className="btn"
                onClick={() => {
                  setConclDateFrom(conclDateFromDraft);
                  setConclDateTo(conclDateToDraft);
                  setConclFiltroPanel(false);
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {conclusionDrawer && (
        <div className="drawerOverlay" onClick={closeConclusionDrawer}>
          <div
            className="drawerCard drawerCardCol"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">{PEN_ICON}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>
                  Nueva conclusión
                </div>
                <div className="fichaSub" style={{ margin: 0 }}>
                  {student.full_name} · {classroom_name}
                </div>
              </div>
              <button
                className="modalX"
                onClick={closeConclusionDrawer}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="drawerBody">
              <p className="hint" style={{ marginTop: 0 }}>
                Genera un borrador con logros, dificultades y recomendaciones a
                partir de las observaciones registradas.{" "}
                <strong>Siempre lo revisas y editas tú.</strong>
              </p>

              {conclusionError && (
                <div
                  className="loginError"
                  role="alert"
                  style={{ marginBottom: 12 }}
                >
                  {conclusionError}
                </div>
              )}

              {conclusionState === "idle" && (
                <button
                  className="btn btnBlock"
                  onClick={runGenerateConclusion}
                >
                  ✦ Generar borrador con IA
                </button>
              )}

              {conclusionState === "loading" && (
                <div className="loading">
                  Analizando las observaciones de{" "}
                  {firstName(student.full_name)}…
                </div>
              )}

              {(conclusionState === "ready" ||
                conclusionState === "saving") && (
                <>
                  <div className="draftBadge">
                    Borrador IA — requiere revisión del docente
                    {conclusionBasedOn !== null && (
                      <span
                        className="hintSmall"
                        style={{ marginLeft: 8 }}
                      >
                        Basado en {conclusionBasedOn} observaciones
                      </span>
                    )}
                  </div>
                  <textarea
                    className="draftArea"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={13}
                    disabled={conclusionState === "saving"}
                  />
                </>
              )}
            </div>

            <div className="drawerPie">
              {conclusionState === "ready" ||
              conclusionState === "saving" ? (
                <>
                  <button
                    className="btnGhost"
                    onClick={runGenerateConclusion}
                    disabled={conclusionState === "saving"}
                  >
                    Regenerar
                  </button>
                  <button
                    className="btn"
                    onClick={runConfirmConclusion}
                    disabled={
                      conclusionState === "saving" || !conclusion.trim()
                    }
                  >
                    {conclusionState === "saving"
                      ? "Guardando…"
                      : "Guardar conclusión"}
                  </button>
                </>
              ) : (
                <button
                  className="btnGhost"
                  onClick={closeConclusionDrawer}
                  disabled={conclusionState === "loading"}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {obs_drawer && (
        <div className="drawerOverlay" onClick={closeDrawer}>
          <div
            className="drawerCard drawerCardCol"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">{PEN_ICON}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>
                  Agregar observación
                </div>
                <div className="fichaSub" style={{ margin: 0 }}>
                  {student.full_name} · {classroom_name}
                </div>
              </div>
              <button
                className="modalX"
                onClick={closeDrawer}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="drawerBody">
              <div className="modoGrid">
                <button
                  className={
                    "modoCard" + (obs_drawer === "voz" ? " modoCardOn" : "")
                  }
                  onClick={openVoiceDrawer}
                >
                  <span
                    className={
                      "modoIco" + (obs_drawer === "voz" ? " modoIcoOn" : "")
                    }
                  >
                    {MIC_ICON}
                  </span>
                  <span className="modoTxt">
                    <strong>Con voz o prompt</strong>
                    <span>
                      Dicta o escribe suelto; la IA arma el borrador y sugiere
                      la competencia.
                    </span>
                  </span>
                </button>
                <button
                  className={
                    "modoCard" + (obs_drawer === "manual" ? " modoCardOn" : "")
                  }
                  onClick={openManualDrawer}
                >
                  <span
                    className={
                      "modoIco" + (obs_drawer === "manual" ? " modoIcoOn" : "")
                    }
                  >
                    {PEN_ICON}
                  </span>
                  <span className="modoTxt">
                    <strong>Manualmente</strong>
                    <span>
                      Eliges la competencia y redactas la observación tú.
                    </span>
                  </span>
                </button>
              </div>

              {obs_drawer === "voz" && (
                <>
                  <div className="drawerLbl">
                    Dicta o escribe lo que observaste
                  </div>
                  <textarea
                    className="draftArea"
                    rows={4}
                    placeholder="Ej.: hoy compartió sus bloques con Mateo sin que nadie se lo pidiera"
                    value={voice.transcript}
                    onChange={(e) =>
                      setVoice(
                        voice.mode === "ready"
                          ? { mode: "idle", transcript: e.target.value }
                          : { ...voice, transcript: e.target.value },
                      )
                    }
                  />
                  <button
                    className="btnGhost btnLbl"
                    style={{ marginTop: 10 }}
                    onClick={dictarVoz}
                  >
                    {MIC_ICON}
                    Dictar
                  </button>
                  <div className="hintSmall" style={{ marginTop: 8 }}>
                    Sin corregir. La IA lo ordena y sugiere la competencia; tú
                    confirmas antes de guardar.
                  </div>

                  {voice.mode !== "ready" && (
                    <button
                      className="btn btnBlock"
                      style={{ marginTop: 16 }}
                      disabled={
                        !voice.transcript.trim() ||
                        voice.mode === "listening" ||
                        voice.mode === "processing"
                      }
                      onClick={generarBorrador}
                    >
                      ✦ Generar borrador
                    </button>
                  )}

                  {voice.mode === "listening" && (
                    <div className="voicePanel">
                      <VoiceDots>Escuchando… habla con naturalidad.</VoiceDots>
                    </div>
                  )}
                  {voice.mode === "processing" && (
                    <div className="voicePanel">
                      <VoiceDots>
                        Interpretando y armando el borrador…
                      </VoiceDots>
                    </div>
                  )}
                  {voice.mode === "ready" && (
                    <>
                      <div className="draftBadge" style={{ marginTop: 16 }}>
                        <strong>Borrador generado.</strong> Revísalo y edítalo —
                        no se guarda nada hasta que confirmes.
                      </div>
                      <div className="drawerLbl">
                        Competencia{" "}
                        <span className="iaTag">sugerida por IA</span>
                      </div>
                      <select
                        className="input"
                        value={voice.draft.id_competency}
                        onChange={(e) =>
                          setVoice({
                            ...voice,
                            draft: {
                              ...voice.draft,
                              id_competency: e.target.value as UUID | "",
                            },
                          })
                        }
                      >
                        <option value="">Sin competencia</option>
                        {competencies.map((c) => (
                          <option key={c.id_competency} value={c.id_competency}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="drawerLbl">Materia (opcional)</div>
                      <select
                        className="input"
                        value={voice.draft.id_subject}
                        onChange={(e) =>
                          setVoice({
                            ...voice,
                            draft: {
                              ...voice.draft,
                              id_subject: e.target.value as UUID | "",
                            },
                          })
                        }
                      >
                        <option value="">Sin materia</option>
                        {subjects.map((s) => (
                          <option key={s.id_subject} value={s.id_subject}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <div className="drawerLbl">Observación</div>
                      <textarea
                        className="draftArea"
                        rows={6}
                        value={voice.draft.text}
                        onChange={(e) =>
                          setVoice({
                            ...voice,
                            draft: { ...voice.draft, text: e.target.value },
                          })
                        }
                      />
                    </>
                  )}
                </>
              )}

              {obs_drawer === "manual" && (
                <>
                  <div className="drawerLbl">Competencia</div>
                  <select
                    className="input"
                    value={obs_manual_competency}
                    onChange={(e) =>
                      setObsManualCompetency(e.target.value as UUID | "")
                    }
                  >
                    <option value="">Selecciona una competencia</option>
                    {competencies.map((c) => (
                      <option key={c.id_competency} value={c.id_competency}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="drawerLbl">Materia (opcional)</div>
                  <select
                    className="input"
                    value={obs_manual_subject}
                    onChange={(e) =>
                      setObsManualSubject(e.target.value as UUID | "")
                    }
                  >
                    <option value="">Sin materia</option>
                    {subjects.map((s) => (
                      <option key={s.id_subject} value={s.id_subject}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="drawerLbl">Observación</div>
                  <textarea
                    className="draftArea"
                    rows={7}
                    placeholder={`Observación de ${firstName(student.full_name)}…`}
                    value={obs_manual_text}
                    onChange={(e) => setObsManualText(e.target.value)}
                  />
                </>
              )}

              {obsError && (
                <div className="loginError" role="alert" style={{ marginTop: 12 }}>
                  {obsError}
                </div>
              )}
            </div>

            <div className="drawerPie">
                {obs_drawer === "voz" ? (
                  <>
                    <button
                      className="btnGhost"
                      onClick={() => {
                        if (voice.mode === "ready") {
                          setVoice({ mode: "idle", transcript: voice.transcript });
                        } else {
                          closeDrawer();
                        }
                      }}
                      disabled={obsSaving}
                    >
                      {voice.mode === "ready" ? "Volver a generar" : "Cancelar"}
                    </button>
                    <button
                      className="btn"
                      disabled={voice.mode !== "ready" || obsSaving}
                      onClick={guardarObsVoz}
                    >
                      {obsSaving ? "Guardando…" : "Guardar observación"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btnGhost"
                      onClick={closeDrawer}
                      disabled={obsSaving}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn"
                      onClick={guardarObsManual}
                      disabled={obsSaving}
                    >
                      {obsSaving ? "Guardando…" : "Guardar observación"}
                    </button>
                  </>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
