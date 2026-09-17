import { useEffect, useState } from "react";
import type {
  Classroom,
  Competency,
  Student,
  UserRole,
  UUID,
} from "@/types/domain";
import { CHAT_QA_PAIRS, type ChatQaPair } from "@/data/chatAssistant";
import { MOCK_STUDENTS } from "@/data/students";
import { MOCK_CLASSROOMS } from "@/data/classrooms";
import { COMPETENCIES as MOCK_COMPETENCIES } from "@/data/competencies";
import { VOICE_SAMPLES_OBSERVATION } from "@/data/voiceSamples";
import { renderRichText } from "@/lib/renderRichText";
import { pickRandom } from "@/lib/random";
import { capitalizeSentence } from "@/lib/text";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/contexts/ToastContext";
import { listStudents } from "@/lib/api/students";
import { listClassrooms } from "@/lib/api/classrooms";
import { listCompetencies } from "@/lib/api/competencies";
import {
  createObservation,
  generateObservationDraft,
} from "@/lib/api/observations";
import { ApiError } from "@/lib/api";

interface AiChatAssistantProps {
  role: Extract<UserRole, "teacher" | "school_admin">;
}

interface ChatMessage {
  from: "me" | "ai";
  text: string;
}

interface ActionDraft {
  id_classroom: UUID | "";
  id_student: UUID;
  id_competency: UUID | "";
  id_subject: UUID | "";
  text: string;
}

type ActionState =
  | { mode: "idle" }
  | { mode: "listening" }
  | { mode: "processing" }
  | { mode: "ready"; draft: ActionDraft };

export const ACTION_REGISTERED_EVENT = "kuntur:action-registered";

export interface ActionRegisteredDetail {
  id_student: UUID;
  id_competency: UUID;
  text: string;
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Busca en `text` un alumno por nombre completo primero, luego por nombre de
// pila. Devuelve el primer match (los transcripts son cortos, no vale la pena
// puntuar).
function findStudentInText(
  text: string,
  students: Student[],
): Student | undefined {
  const haystack = stripDiacritics(text.toLowerCase());
  const by_full = students.find((s) =>
    haystack.includes(stripDiacritics(s.full_name.toLowerCase())),
  );
  if (by_full) return by_full;
  return students.find((s) => {
    const first = stripDiacritics(
      (s.full_name.split(/\s+/)[0] ?? "").toLowerCase(),
    );
    if (!first) return false;
    return new RegExp(`\\b${first}\\b`).test(haystack);
  });
}

export default function AiChatAssistant({ role }: AiChatAssistantProps) {
  const { session } = useSession();
  const { showToast } = useToast();
  const id_school = session?.id_school ?? null;

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [action, setAction] = useState<ActionState | null>(null);
  const [actionText, setActionText] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "ai",
      text:
        role === "teacher"
          ? "Hola, Miss Carla 👋 Pregúntame lo que necesites del Aula Amarilla: asistencias, observaciones, comunicados pendientes."
          : "Hola 👋 Pregúntame lo que necesites del nido: asistencias, observaciones, comunicados pendientes o el avance de un alumno.",
    },
  ]);

  // Carga aulas + alumnos + competencias accesibles al actor cuando se abre el
  // drawer por primera vez. El backend filtra por rol (docente ve solo su aula).
  // Fallback a los mocks si falla la sesión.
  useEffect(() => {
    if (
      !action ||
      (students.length > 0 &&
        classrooms.length > 0 &&
        competencies.length > 0)
    ) {
      return;
    }
    let cancelled = false;
    Promise.all([
      listStudents({ id_school }),
      listClassrooms({ id_school }),
      listCompetencies(),
    ])
      .then(([student_rows, classroom_rows, competency_rows]) => {
        if (cancelled) return;
        if (student_rows.length > 0) setStudents(student_rows);
        if (classroom_rows.length > 0) setClassrooms(classroom_rows);
        if (competency_rows.length > 0) setCompetencies(competency_rows);
      })
      .catch(() => {
        if (cancelled) return;
        setStudents(MOCK_STUDENTS);
        setClassrooms(MOCK_CLASSROOMS);
        setCompetencies(MOCK_COMPETENCIES);
      });
    return () => {
      cancelled = true;
    };
  }, [action, id_school, students.length, classrooms.length, competencies.length]);

  const student_source = students.length > 0 ? students : MOCK_STUDENTS;
  const classroom_source_all =
    classrooms.length > 0 ? classrooms : MOCK_CLASSROOMS;
  const competency_source =
    competencies.length > 0 ? competencies : MOCK_COMPETENCIES;
  // Solo aulas con al menos un alumno accesible al actor.
  const classroom_source = classroom_source_all.filter((c) =>
    student_source.some((s) => s.id_classroom === c.id_classroom),
  );

  const ask = (pair: ChatQaPair) => {
    setMessages((prev) => [...prev, { from: "me", text: pair.question }]);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [...prev, { from: "ai", text: pair.answer }]);
    }, 1100);
  };

  const usedQuestions = new Set(
    messages.filter((m) => m.from === "me").map((m) => m.text),
  );
  const suggestions = CHAT_QA_PAIRS.filter(
    (x) => !usedQuestions.has(x.question),
  ).slice(0, 3);

  const closeAction = () => {
    setAction(null);
    setActionText("");
    setActionError("");
    setSaving(false);
  };

  const startDictation = () => {
    setActionError("");
    setAction({ mode: "listening" });
    window.setTimeout(() => {
      setActionText(pickRandom(VOICE_SAMPLES_OBSERVATION));
      setAction({ mode: "idle" });
    }, 1600);
  };

  const generateDraft = async (source: "voice" | "text" = "text") => {
    const raw = actionText.trim();
    if (!raw) return;
    setActionError("");
    setAction({ mode: "processing" });
    // La detección de alumno se hace acá, no en tiempo real mientras escribe.
    const matched = findStudentInText(raw, student_source);
    const chosen = matched ?? student_source[0];
    if (!chosen) {
      setAction({ mode: "idle" });
      setActionError("No hay alumnos disponibles para registrar la acción.");
      return;
    }
    const initial_classroom = (chosen.id_classroom ?? "") as UUID | "";
    try {
      const res = await generateObservationDraft({
        id_student: chosen.id_student,
        transcript: raw,
        source,
      });
      setAction({
        mode: "ready",
        draft: {
          id_classroom: initial_classroom,
          id_student: chosen.id_student,
          id_competency: (res.id_competency ?? "") as UUID | "",
          id_subject: (res.id_subject ?? "") as UUID | "",
          text: res.draft?.trim() || capitalizeSentence(raw),
        },
      });
    } catch (err) {
      // Sesión mock / backend caído → borrador local para no romper la demo.
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el borrador. Usa el que se preparó localmente.";
      setActionError(message);
      setAction({
        mode: "ready",
        draft: {
          id_classroom: initial_classroom,
          id_student: chosen.id_student,
          id_competency: "",
          id_subject: "",
          text: capitalizeSentence(raw),
        },
      });
    }
  };

  const confirmDraft = async () => {
    if (!action || action.mode !== "ready" || saving) return;
    const trimmed = action.draft.text.trim();
    if (!trimmed) {
      setActionError("El borrador no puede quedar vacío.");
      return;
    }
    if (!action.draft.id_competency) {
      setActionError(
        "No se pudo asociar una competencia — vuelve a generar el borrador.",
      );
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      await createObservation({
        id_student: action.draft.id_student,
        id_competency: action.draft.id_competency,
        id_subject: action.draft.id_subject || null,
        content: trimmed,
        source: "voice",
      });
      const detail: ActionRegisteredDetail = {
        id_student: action.draft.id_student,
        id_competency: action.draft.id_competency,
        text: trimmed,
      };
      window.dispatchEvent(
        new CustomEvent<ActionRegisteredDetail>(ACTION_REGISTERED_EVENT, {
          detail,
        }),
      );
      const student_name =
        student_source.find((s) => s.id_student === detail.id_student)
          ?.full_name ?? "el alumno";
      showToast(`Observación registrada en la ficha de ${student_name} ✓`);
      closeAction();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la observación.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fabStack">
        {menu && !open && (
          <>
            <button
              className="fabItem"
              onClick={() => {
                setMenu(false);
                setAction({ mode: "idle" });
              }}
            >
              <span className="fabItemIco">✎</span>
              Registrar acción
            </button>
            <button
              className="fabItem"
              onClick={() => {
                setMenu(false);
                setOpen(true);
              }}
            >
              <span className="fabItemIco">✦</span>
              Pregúntale al aula
            </button>
          </>
        )}
        <button
          className={"chatFab" + (open || menu ? " chatFabOn" : "")}
          onClick={() => {
            if (open) setOpen(false);
            else setMenu((v) => !v);
          }}
          aria-label={open || menu ? "Cerrar acciones" : "Abrir acciones"}
        >
          {open || menu ? "✕" : "✦"}
          {!open && !menu && <span className="chatFabTxt">Asistente</span>}
        </button>
      </div>

      {action && (
        <div className="drawerOverlay" onClick={closeAction}>
          <div
            className="drawerCard drawerCardCol"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">✎</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>
                  Registrar acción
                </div>
                <div className="fichaSub" style={{ margin: 0 }}>
                  Escribe o dicta lo que pasó; se arma el borrador
                </div>
              </div>
              <button
                className="modalX"
                onClick={closeAction}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="drawerBody formCol">
              {action.mode !== "ready" ? (
                <>
                  <div className="drawerLbl">¿Qué pasó?</div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Ej. Mateo compartió sus bloques sin que se le pida"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    disabled={action.mode !== "idle"}
                  />
                  {action.mode === "listening" && (
                    <div className="vozState">
                      <span className="vozPulse" />
                      Escuchando…
                    </div>
                  )}
                  {action.mode === "processing" && (
                    <div className="vozState">
                      <span className="vozPulse" />
                      Armando el borrador…
                    </div>
                  )}
                  {actionError && (
                    <div className="vozState" style={{ color: "#B02A37" }}>
                      {actionError}
                    </div>
                  )}
                  <div className="drawerActions">
                    <button
                      className="btnGhost btnLbl"
                      onClick={startDictation}
                      disabled={action.mode !== "idle"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"
                        />
                      </svg>
                      Dictar
                    </button>
                    <button
                      className="btn"
                      onClick={() => void generateDraft("text")}
                      disabled={action.mode !== "idle" || !actionText.trim()}
                    >
                      Generar borrador
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="drawerLbl">Aula</div>
                  <select
                    className="input"
                    value={action.draft.id_classroom}
                    onChange={(e) => {
                      const next_classroom = e.target.value as UUID;
                      const first_in_classroom = student_source.find(
                        (s) => s.id_classroom === next_classroom,
                      );
                      setAction({
                        ...action,
                        draft: {
                          ...action.draft,
                          id_classroom: next_classroom,
                          id_student:
                            first_in_classroom?.id_student ??
                            action.draft.id_student,
                        },
                      });
                    }}
                  >
                    {classroom_source.map((c) => (
                      <option key={c.id_classroom} value={c.id_classroom}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="drawerLbl">Alumno</div>
                  <select
                    className="input"
                    value={action.draft.id_student}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        draft: { ...action.draft, id_student: e.target.value },
                      })
                    }
                  >
                    {student_source
                      .filter(
                        (st) => st.id_classroom === action.draft.id_classroom,
                      )
                      .map((st) => (
                        <option key={st.id_student} value={st.id_student}>
                          {st.full_name}
                        </option>
                      ))}
                  </select>
                  <div className="drawerLbl">Competencia</div>
                  <select
                    className="input"
                    value={action.draft.id_competency}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        draft: {
                          ...action.draft,
                          id_competency: e.target.value as UUID | "",
                        },
                      })
                    }
                  >
                    <option value="" disabled>
                      Selecciona una competencia
                    </option>
                    {competency_source.map((c) => (
                      <option key={c.id_competency} value={c.id_competency}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="drawerLbl">Borrador</div>
                  <textarea
                    className="input"
                    rows={4}
                    value={action.draft.text}
                    onChange={(e) =>
                      setAction({
                        ...action,
                        draft: { ...action.draft, text: e.target.value },
                      })
                    }
                  />
                  {actionError && (
                    <div className="vozState" style={{ color: "#B02A37" }}>
                      {actionError}
                    </div>
                  )}
                  <div className="drawerActions">
                    <button
                      className="btnGhost"
                      onClick={() => {
                        setAction({ mode: "idle" });
                        setActionError("");
                      }}
                      disabled={saving}
                    >
                      Volver a dictar
                    </button>
                    <button
                      className="btn"
                      onClick={() => void confirmDraft()}
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Confirmar y guardar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div
          className="chatPanel"
          role="dialog"
          aria-label="Asistente del aula"
        >
          <div className="chatHead">
            <span className="chatDot" aria-hidden="true">
              ✦
            </span>
            <div>
              <div className="chatTitle">Asistente del aula</div>
              <div className="chatSub">
                Responde sobre lo registrado en el sistema
              </div>
            </div>
          </div>

          <div className="chatBody">
            {messages.map((m, i) => (
              <div key={i} className={m.from === "me" ? "chatMe" : "chatIa"}>
                {m.from === "ai" ? renderRichText(m.text) : m.text}
              </div>
            ))}
            {thinking && (
              <div className="chatIa chatThinking">
                <span className="chatDots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                Revisando los registros del aula…
              </div>
            )}
          </div>

          {suggestions.length > 0 && !thinking && (
            <div className="chatSug">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chatSugBtn"
                  onClick={() => ask(s)}
                >
                  {s.question}
                </button>
              ))}
            </div>
          )}

          <div className="chatFoot">
            <input
              className="input"
              placeholder="Escribe tu pregunta…"
              disabled
            />
            <span className="chatFootNote">
              Demo · usa las preguntas sugeridas
            </span>
          </div>
        </div>
      )}
    </>
  );
}
