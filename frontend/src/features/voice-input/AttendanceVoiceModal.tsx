import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Chip } from "@/components/Chip";
import { VoiceDots } from "@/components/VoiceDots";
import {
  parseAttendanceDictation,
  type AttendanceDictationResult,
} from "@/lib/voiceParser";
import { pickRandom } from "@/lib/random";
import { VOICE_SAMPLES_ATTENDANCE } from "@/data/voiceSamples";
import type { AttendanceStatus, Student, UUID } from "@/types/domain";

type ModalMode = "listening" | "processing" | "preview";

interface AttendanceVoiceModalProps {
  students: readonly Student[];
  current_by_student: Record<UUID, AttendanceStatus>;
  onClose: () => void;
  onConfirm: (proposed: Record<UUID, AttendanceStatus>) => void;
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Presente",
  late: "Tarde",
  absent: "Falta",
};

const STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "P",
  late: "T",
  absent: "F",
};

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  present: "asisP",
  late: "asisT",
  absent: "asisF",
};

export function AttendanceVoiceModal({
  students,
  current_by_student,
  onClose,
  onConfirm,
}: AttendanceVoiceModalProps) {
  const [mode, setMode] = useState<ModalMode>("listening");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<AttendanceDictationResult | null>(null);

  useEffect(() => {
    const sample = pickRandom(VOICE_SAMPLES_ATTENDANCE);
    const listeningTimer = window.setTimeout(() => {
      setTranscript(sample);
      setMode("processing");
      const parseTimer = window.setTimeout(() => {
        setResult(parseAttendanceDictation(sample, students, current_by_student));
        setMode("preview");
      }, 1100);
      return () => window.clearTimeout(parseTimer);
    }, 2400);
    return () => window.clearTimeout(listeningTimer);
  }, [students, current_by_student]);

  const overridePreview = (id_student: UUID, next: AttendanceStatus) => {
    if (!result) return;
    const changedIds = new Set(result.changedIds);
    const original = current_by_student[id_student];
    if (next !== original) changedIds.add(id_student);
    else changedIds.delete(id_student);
    setResult({
      ...result,
      proposed: { ...result.proposed, [id_student]: next },
      changedIds,
    });
  };

  const totals = result
    ? {
        present: students.filter((s) => result.proposed[s.id_student] === "present").length,
        late: students.filter((s) => result.proposed[s.id_student] === "late").length,
        absent: students.filter((s) => result.proposed[s.id_student] === "absent").length,
      }
    : { present: 0, late: 0, absent: 0 };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalCard voiceAsisCard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHead">
          <div className="cardEyebrow" style={{ margin: 0 }}>
            Asistencia por voz
          </div>
          <button className="modalX" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {mode === "listening" && (
          <div className="voicePanel">
            <VoiceDots>Escuchando… di quiénes faltaron o llegaron tarde.</VoiceDots>
            <div className="hintSmall">
              Ej.: “todos presentes menos Mateo Quispe” o “Luciana Flores tarde”.
            </div>
          </div>
        )}

        {mode === "processing" && (
          <div className="voicePanel">
            <div className="voiceTranscript">“{transcript}”</div>
            <VoiceDots>Interpretando y armando la vista previa…</VoiceDots>
          </div>
        )}

        {mode === "preview" && result && (
          <>
            <div className="voicePanel">
              <div className="draftBadge">
                Vista previa — revisa y confirma antes de guardar
              </div>
              <div className="voiceTranscript">“{transcript}”</div>
              <div className="asisMini" style={{ marginTop: 6 }}>
                <span style={{ color: "var(--green)" }}>{totals.present} P</span>
                <span style={{ color: "var(--amber)" }}>{totals.late} T</span>
                <span style={{ color: "var(--margin)" }}>{totals.absent} F</span>
                {result.changedIds.size > 0 && (
                  <Chip tone="pen">
                    {result.changedIds.size} cambio
                    {result.changedIds.size === 1 ? "" : "s"}
                  </Chip>
                )}
              </div>
              {result.notRecognized.length > 0 && (
                <div className="voiceNotRec">
                  No reconocidos: {result.notRecognized.join(", ")}. Usa nombre
                  completo del alumno.
                </div>
              )}
            </div>
            <div className="asisList" style={{ maxHeight: 340, overflowY: "auto" }}>
              {students.map((s) => {
                const original = current_by_student[s.id_student]!;
                const proposed = result.proposed[s.id_student]!;
                const changed = result.changedIds.has(s.id_student);
                return (
                  <div
                    key={s.id_student}
                    className={"asisRow" + (changed ? " asisRowChanged" : "")}
                  >
                    <div className="asisNameBtn" style={{ cursor: "default" }}>
                      <Avatar full_name={s.full_name} size={30} />
                      <span className="asisName">
                        {s.full_name}
                        {changed && (
                          <Chip tone="pen">
                            {STATUS_LABEL[original]} → {STATUS_LABEL[proposed]}
                          </Chip>
                        )}
                      </span>
                    </div>
                    <div className="asisBtns">
                      {(Object.keys(STATUS_SHORT) as AttendanceStatus[]).map(
                        (v) => (
                          <button
                            key={v}
                            onClick={() => overridePreview(s.id_student, v)}
                            className={
                              "asisBtn " + (proposed === v ? STATUS_CLASS[v] : "")
                            }
                          >
                            {STATUS_SHORT[v]}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modalActions" style={{ marginTop: 12 }}>
          <button className="btnGhost" onClick={onClose}>
            Cancelar
          </button>
          {mode === "preview" && result && (
            <button
              className="btn"
              onClick={() => onConfirm(result.proposed)}
            >
              Confirmar asistencia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
