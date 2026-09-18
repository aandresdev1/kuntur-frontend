import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip, type ChipTone } from "@/components/Chip";
import { MockBadge } from "@/components/MockBadge";
import { useSession } from "@/contexts/SessionContext";
import {
  MOCK_CLASSROOMS,
  CLASSROOM_PRESENTATION,
} from "@/data/classrooms";
import { studentsInClassroom } from "@/data/students";
import {
  ATTENDANCE_HISTORY,
  MONTH_ABSENCES_BY_STUDENT,
  TODAY,
  TODAY_ATTENDANCE_BY_STUDENT,
} from "@/data/attendance";
import { AttendanceVoiceModal } from "@/features/voice-input/AttendanceVoiceModal";
import { ApiError } from "@/lib/api";
import { listClassrooms } from "@/lib/api/classrooms";
import { listStudents } from "@/lib/api/students";
import {
  attendanceForClassroom,
  attendanceForStudent,
  bulkMarkAttendance,
} from "@/lib/api/attendance";
import type {
  Attendance,
  AttendanceStatus,
  Classroom,
  Student,
  UUID,
} from "@/types/domain";

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

const STATUS_CHIP_TONE: Record<AttendanceStatus, ChipTone> = {
  present: "green",
  late: "amber",
  absent: "red",
};

const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);
const MIC_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z"
    />
  </svg>
);

function todayIso(): string {
  // Fecha calendario del navegador (local) — evita que a partir de las 19:00
  // en Perú (UTC-5) el ISO en UTC salte al día siguiente y se guarde la
  // asistencia con la fecha equivocada.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateEs(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function AttendancePage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;

  return session.role === "teacher" ? (
    <TeacherAttendance />
  ) : (
    <SchoolAdminAttendanceMock />
  );
}

// ─── Teacher (backend-wired) ─────────────────────────────────────────────────

function TeacherAttendance() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [id_classroom, setIdClassroom] = useState<UUID | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [rosterStatus, setRosterStatus] = useState<
    Record<UUID, AttendanceStatus>
  >({});
  const [initialByStudent, setInitialByStudent] = useState<
    Record<UUID, AttendanceStatus>
  >({});
  const [selected_iso, setSelectedIso] = useState<string>(todayIso());
  const [name_filter, setNameFilter] = useState("");
  const [student_history_id, setStudentHistoryId] = useState<UUID | null>(null);
  const [voice_open, setVoiceOpen] = useState(false);

  const [pageStatus, setPageStatus] = useState<
    "loading" | "no_classroom" | "ready" | "error"
  >("loading");
  const [pageError, setPageError] = useState("");
  const [dayStatus, setDayStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [dayError, setDayError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  /**
   * Solo indica el "acabo de confirmar recién" para mostrar el ✓ tras un save.
   * El estado real ("ya está confirmada para este día") se deriva más abajo de
   * `initialByStudent` vs `rosterStatus`, para que sobreviva a un refresh.
   */
  const [justSaved, setJustSaved] = useState(false);

  const today = todayIso();
  const is_today = selected_iso === today;

  // Load teacher's classrooms + students of the first classroom.
  useEffect(() => {
    let cancelled = false;
    setPageStatus("loading");
    setPageError("");
    listClassrooms()
      .then(async (list) => {
        if (cancelled) return;
        setClassrooms(list);
        if (list.length === 0) {
          setPageStatus("no_classroom");
          return;
        }
        const first = list[0]!.id_classroom;
        setIdClassroom(first);
        const roster = await listStudents({ id_classroom: first });
        if (cancelled) return;
        setStudents(roster);
        setPageStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setPageError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar tu asistencia.",
        );
        setPageStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When the selected classroom changes (rare — hoy solo hay una selectable),
  // refetch its students.
  const changeClassroom = useCallback((next: UUID) => {
    setIdClassroom(next);
    setStudents([]);
    setPageStatus("loading");
    setPageError("");
    listStudents({ id_classroom: next })
      .then((roster) => {
        setStudents(roster);
        setPageStatus("ready");
      })
      .catch((err) => {
        setPageError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el aula.",
        );
        setPageStatus("error");
      });
  }, []);

  // Load the day's attendance for the selected classroom + date.
  useEffect(() => {
    if (!id_classroom) return;
    let cancelled = false;
    setDayStatus("loading");
    setDayError("");
    setJustSaved(false);
    attendanceForClassroom(id_classroom, selected_iso)
      .then((rows) => {
        if (cancelled) return;
        const initial: Record<UUID, AttendanceStatus> = {};
        for (const row of rows) initial[row.id_student] = row.status;
        setInitialByStudent(initial);
        // La fecha cambió: reseteamos rosterStatus al estado persistido para
        // que "Confirmar" no reenvíe ediciones locales de otro día.
        setRosterStatus({ ...initial });
        setDayStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setDayError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el día.",
        );
        setDayStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_classroom, selected_iso]);

  const setStatusFor = (id_student: UUID, next: AttendanceStatus) => {
    setRosterStatus((prev) => ({ ...prev, [id_student]: next }));
    setJustSaved(false);
    setSaveError("");
  };

  const confirmAttendance = async () => {
    if (!id_classroom || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const entries = students.map((s) => ({
        id_student: s.id_student,
        status: (rosterStatus[s.id_student] ?? "present") as AttendanceStatus,
      }));
      if (entries.length === 0) {
        setJustSaved(true);
        return;
      }
      await bulkMarkAttendance({
        id_classroom,
        date: selected_iso,
        entries,
      });
      const persisted: Record<UUID, AttendanceStatus> = {};
      for (const e of entries) persisted[e.id_student] = e.status;
      setInitialByStudent(persisted);
      setJustSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la asistencia.",
      );
    } finally {
      setSaving(false);
    }
  };

  const currentClassroom = useMemo(
    () => classrooms.find((c) => c.id_classroom === id_classroom) ?? null,
    [classrooms, id_classroom],
  );

  if (pageStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Asistencia.</div>
        <div className="pageSub">Cargando tu aula…</div>
      </div>
    );
  }

  if (pageStatus === "no_classroom") {
    return (
      <div>
        <div className="pageTitle">Asistencia.</div>
        <Card>
          <div className="hint">
            No tienes ningún aula asignada todavía. Contacta a la dirección.
          </div>
        </Card>
      </div>
    );
  }

  if (pageStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Asistencia.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {pageError}
        </div>
      </div>
    );
  }

  const yesterday = shiftIso(today, -1);

  const roster = students.map((s) => ({
    student: s,
    status: (rosterStatus[s.id_student] ??
      initialByStudent[s.id_student] ??
      "present") as AttendanceStatus,
    hasFila: initialByStudent[s.id_student] !== undefined,
  }));

  const present_count = roster.filter((r) => r.status === "present").length;
  const late_count = roster.filter((r) => r.status === "late").length;
  const absent_count = roster.filter((r) => r.status === "absent").length;

  // "Ya confirmada": todos los alumnos tienen registro persistido para este día
  // y no hay ediciones locales sin guardar. Se recalcula tras cada carga, así
  // que un refresh no te deja "re-guardar" datos ya persistidos.
  const allCovered =
    students.length > 0 && students.every((s) => initialByStudent[s.id_student] !== undefined);
  const dirty = students.some((s) => {
    const current = rosterStatus[s.id_student] ?? initialByStudent[s.id_student];
    return current !== initialByStudent[s.id_student];
  });
  const alreadyConfirmed = allCovered && !dirty;
  const confirmed = justSaved || alreadyConfirmed;

  const q = name_filter.trim().toLowerCase();
  const filtered_roster = q
    ? roster.filter((r) => r.student.full_name.toLowerCase().includes(q))
    : roster;

  return (
    <div>
      <div className="pageTitle">Asistencia.</div>
      <div className="pageSub">
        {currentClassroom?.name ?? "—"} · {students.length} alumnos
      </div>

      {classrooms.length > 1 && (
        <div className="chipsBar">
          {classrooms.map((c) => (
            <button
              key={c.id_classroom}
              className={
                "chipBtn" + (c.id_classroom === id_classroom ? " chipBtnOn" : "")
              }
              onClick={() => changeClassroom(c.id_classroom)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="cuadHeader cuadHeaderTools">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%", alignItems: "center" }}>
          <div className="searchBox searchBoxWide">
            <input
              className="input"
              placeholder="Filtrar esta lista…"
              value={name_filter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <button
              className="searchBoxBtn"
              title="Buscar"
              aria-label="Buscar"
            >
              {SEARCH_ICON}
            </button>
          </div>
          <button
            className={"chipBtn" + (selected_iso === today ? " chipBtnOn" : "")}
            onClick={() => setSelectedIso(today)}
          >
            Hoy
          </button>
          <button
            className={"chipBtn" + (selected_iso === yesterday ? " chipBtnOn" : "")}
            onClick={() => setSelectedIso(yesterday)}
          >
            Ayer
          </button>
          <input
            type="date"
            className="input dateInput"
            value={selected_iso}
            max={today}
            onChange={(e) => setSelectedIso(e.target.value)}
          />
          {is_today && (
            <>
              <button
                className="btnGhost btnLbl"
                onClick={() => setVoiceOpen(true)}
                disabled={saving}
              >
                {MIC_ICON}
                Por voz
              </button>
              <button
                className="btn"
                disabled={saving || confirmed}
                onClick={confirmAttendance}
              >
                {saving
                  ? "Guardando…"
                  : confirmed
                    ? "Asistencia confirmada ✓"
                    : "Confirmar asistencia"}
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="loginError" role="alert" style={{ marginBottom: 12 }}>
          {saveError}
        </div>
      )}

      <Card className="cardFlush">
        {dayStatus === "loading" ? (
          <div className="histEmpty" style={{ marginTop: 14 }}>
            Cargando el día…
          </div>
        ) : dayStatus === "error" ? (
          <div className="loginError" role="alert" style={{ marginTop: 14 }}>
            {dayError}
          </div>
        ) : (
          <>
            <div className="asisDayBar">
              <span className="asisDayName">{formatDateEs(selected_iso)}</span>
              {is_today ? (
                <Chip tone="pen">Editable</Chip>
              ) : (
                <Chip tone="neutral">Solo lectura</Chip>
              )}
              <span className="asisMini">
                <span style={{ color: "var(--green)" }}>{present_count} P</span>
                <span style={{ color: "var(--amber)" }}>{late_count} T</span>
                <span style={{ color: "var(--margin)" }}>{absent_count} F</span>
              </span>
            </div>
            <p className="hint">
              {is_today
                ? "Al marcar F o T, la familia recibe una notificación automática. Toca un alumno para ver su historial."
                : "Toca un alumno para ver su historial de asistencias."}
            </p>
            <div className="asisList">
              {filtered_roster.map(({ student: s, status, hasFila }) => (
                <div key={s.id_student} className="asisRow">
                  <button
                    className="asisNameBtn"
                    onClick={() => setStudentHistoryId(s.id_student)}
                    title="Ver historial de asistencia"
                  >
                    <Avatar full_name={s.full_name} size={34} />
                    <span className="asisName">
                      {s.full_name}
                      {!is_today && !hasFila && (
                        <Chip tone="neutral">Sin registro</Chip>
                      )}
                    </span>
                    <span className="verHist">›</span>
                  </button>
                  {is_today ? (
                    <div className="asisBtns">
                      {(Object.keys(STATUS_SHORT) as AttendanceStatus[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => setStatusFor(s.id_student, v)}
                          className={
                            "asisBtn " + (status === v ? STATUS_CLASS[v] : "")
                          }
                          disabled={saving}
                        >
                          {STATUS_SHORT[v]}
                        </button>
                      ))}
                    </div>
                  ) : hasFila ? (
                    <Chip tone={STATUS_CHIP_TONE[status]}>
                      {STATUS_LABEL[status]}
                    </Chip>
                  ) : (
                    <span className="hintSmall">—</span>
                  )}
                </div>
              ))}
              {filtered_roster.length === 0 && (
                <div className="histEmpty">
                  {students.length === 0
                    ? "El aula no tiene alumnos matriculados."
                    : `Ningún alumno coincide con "${name_filter}".`}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {student_history_id && (
        <StudentHistoryModal
          id_student={student_history_id}
          onClose={() => setStudentHistoryId(null)}
          student_name={
            students.find((x) => x.id_student === student_history_id)
              ?.full_name ?? ""
          }
        />
      )}

      {voice_open && (
        <AttendanceVoiceModal
          students={students}
          current_by_student={rosterStatus}
          onClose={() => setVoiceOpen(false)}
          onConfirm={(proposed) => {
            setRosterStatus(proposed);
            setVoiceOpen(false);
            setJustSaved(false);
          }}
        />
      )}
    </div>
  );
}

interface StudentHistoryModalProps {
  id_student: UUID;
  student_name: string;
  onClose: () => void;
}

function StudentHistoryModal({
  id_student,
  student_name,
  onClose,
}: StudentHistoryModalProps) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Rango: últimos 60 días.
    const today = todayIso();
    const from = shiftIso(today, -60);
    attendanceForStudent(id_student, { from, to: today })
      .then((rows) => {
        if (cancelled) return;
        setRecords(rows);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el historial.",
        );
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_student]);

  const totals = { present: 0, late: 0, absent: 0 } as Record<
    AttendanceStatus,
    number
  >;
  for (const r of records) totals[r.status] += 1;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="histAlumnoHead">
            <Avatar full_name={student_name} size={38} />
            <div>
              <div className="fichaName" style={{ fontSize: 16 }}>
                {student_name}
              </div>
              <div className="fichaSub">Historial de asistencia · últimos 60 días</div>
            </div>
          </div>
          <button
            className="modalX"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {status === "loading" ? (
          <div className="histEmpty">Cargando…</div>
        ) : status === "error" ? (
          <div className="loginError" role="alert">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="histEmpty">Sin registros de asistencia en el rango.</div>
        ) : (
          <>
            <div className="histSummary">
              <span style={{ color: "var(--green)" }}>
                {totals.present} presentes
              </span>
              <span style={{ color: "var(--amber)" }}>
                {totals.late} tardanzas
              </span>
              <span style={{ color: "var(--margin)" }}>
                {totals.absent} faltas
              </span>
            </div>
            <div className="histTL">
              {records.map((r) => {
                const iso = new Date(r.date).toISOString().slice(0, 10);
                return (
                  <div key={r.id_attendance} className="histTLRow">
                    <span className="histTLFecha">{formatDateEs(iso)}</span>
                    <Chip tone={STATUS_CHIP_TONE[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Chip>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── School admin (mock — cableado en pase futuro) ───────────────────────────

type DayEntry =
  | { iso: string; label: string; is_today: true }
  | {
      iso: string;
      label: string;
      is_today: false;
      absent_names: string[];
      late_names: string[];
    };

function statusOnDay(
  student: Student,
  day: DayEntry,
  today_status: AttendanceStatus,
): AttendanceStatus {
  if (day.is_today) return today_status;
  if (day.absent_names.includes(student.full_name)) return "absent";
  if (day.late_names.includes(student.full_name)) return "late";
  return "present";
}

function SchoolAdminAttendanceMock() {
  const targetClassroom: UUID = "cls_amarilla";

  const [rosterStatus, setRosterStatus] = useState<Record<UUID, AttendanceStatus>>(
    TODAY_ATTENDANCE_BY_STUDENT,
  );
  const [selected_iso, setSelectedIso] = useState<string>(TODAY.iso);
  const [name_filter, setNameFilter] = useState("");
  const [student_history_id, setStudentHistoryId] = useState<UUID | null>(null);
  const [voice_open, setVoiceOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const classroom = MOCK_CLASSROOMS.find(
    (c) => c.id_classroom === targetClassroom,
  );
  const classroom_presentation = CLASSROOM_PRESENTATION[targetClassroom];
  const classroom_label = classroom
    ? `${classroom.name}${classroom_presentation ? ` · ${classroom_presentation.level_label.split(" · ")[1] ?? classroom_presentation.level_label}` : ""}`
    : "Aula Amarilla · 4 años";

  const students = studentsInClassroom(targetClassroom);

  const days: DayEntry[] = [
    { iso: TODAY.iso, label: TODAY.label, is_today: true },
    ...ATTENDANCE_HISTORY.map((d) => ({
      iso: d.iso,
      label: d.label,
      is_today: false as const,
      absent_names: d.absent_names,
      late_names: d.late_names,
    })),
  ];
  const day = days.find((d) => d.iso === selected_iso) ?? null;
  const yesterday_iso = ATTENDANCE_HISTORY[0]?.iso ?? TODAY.iso;

  const roster = day
    ? students.map((s) => ({
        student: s,
        status: statusOnDay(s, day, rosterStatus[s.id_student] ?? "present"),
      }))
    : [];

  const present_count = roster.filter((r) => r.status === "present").length;
  const late_count = roster.filter((r) => r.status === "late").length;
  const absent_count = roster.filter((r) => r.status === "absent").length;

  const q = name_filter.trim().toLowerCase();
  const filtered_roster = q
    ? roster.filter((r) => r.student.full_name.toLowerCase().includes(q))
    : roster;

  const setStatusFor = (id_student: UUID, next: AttendanceStatus) => {
    setRosterStatus((prev) => ({ ...prev, [id_student]: next }));
    setConfirmed(false);
  };

  return (
    <div>
      <div className="pageTitle">
        Asistencia.<MockBadge />
      </div>
      <div className="pageSub">
        {classroom_label} · {students.length} alumnos
      </div>

      <div className="cuadHeader cuadHeaderTools">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%", alignItems: "center" }}>
          <div className="searchBox searchBoxWide">
            <input
              className="input"
              placeholder="Filtrar esta lista…"
              value={name_filter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <button
              className="searchBoxBtn"
              title="Buscar"
              aria-label="Buscar"
            >
              {SEARCH_ICON}
            </button>
          </div>
          <button
            className={"chipBtn" + (selected_iso === TODAY.iso ? " chipBtnOn" : "")}
            onClick={() => setSelectedIso(TODAY.iso)}
          >
            Hoy
          </button>
          <button
            className={"chipBtn" + (selected_iso === yesterday_iso ? " chipBtnOn" : "")}
            onClick={() => setSelectedIso(yesterday_iso)}
          >
            Ayer
          </button>
          <input
            type="date"
            className="input dateInput"
            value={selected_iso}
            min={ATTENDANCE_HISTORY[ATTENDANCE_HISTORY.length - 1]?.iso}
            max={TODAY.iso}
            onChange={(e) => setSelectedIso(e.target.value)}
          />
          {day?.is_today && (
            <>
              <button
                className="btnGhost btnLbl"
                onClick={() => setVoiceOpen(true)}
              >
                {MIC_ICON}
                Por voz
              </button>
              <button
                className="btn"
                disabled={confirmed}
                onClick={() => setConfirmed(true)}
              >
                {confirmed ? "Asistencia confirmada ✓" : "Confirmar asistencia"}
              </button>
            </>
          )}
        </div>
      </div>

      <Card className="cardFlush">
        {!day ? (
          <div className="histEmpty" style={{ marginTop: 14 }}>
            No hay registro de asistencia para esa fecha.
          </div>
        ) : (
          <>
            <div className="asisDayBar">
              <span className="asisDayName">{day.label}</span>
              {day.is_today ? (
                <Chip tone="pen">Editable</Chip>
              ) : (
                <Chip tone="neutral">Solo lectura</Chip>
              )}
              <span className="asisMini">
                <span style={{ color: "var(--green)" }}>{present_count} P</span>
                <span style={{ color: "var(--amber)" }}>{late_count} T</span>
                <span style={{ color: "var(--margin)" }}>{absent_count} F</span>
              </span>
            </div>
            <p className="hint">
              {day.is_today
                ? "Al marcar F o T, la familia recibe una notificación automática. Toca un alumno para ver su historial."
                : "Toca un alumno para ver su historial de asistencias."}
            </p>
            <div className="asisList">
              {filtered_roster.map(({ student: s, status }) => (
                <div key={s.id_student} className="asisRow">
                  <button
                    className="asisNameBtn"
                    onClick={() => setStudentHistoryId(s.id_student)}
                    title="Ver historial de asistencia"
                  >
                    <Avatar full_name={s.full_name} size={34} />
                    <span className="asisName">
                      {s.full_name}
                      {(MONTH_ABSENCES_BY_STUDENT[s.id_student] ?? 0) >= 3 && (
                        <Chip tone="red">3 faltas este mes</Chip>
                      )}
                    </span>
                    <span className="verHist">›</span>
                  </button>
                  {day.is_today ? (
                    <div className="asisBtns">
                      {(Object.keys(STATUS_SHORT) as AttendanceStatus[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => setStatusFor(s.id_student, v)}
                          className={
                            "asisBtn " + (status === v ? STATUS_CLASS[v] : "")
                          }
                        >
                          {STATUS_SHORT[v]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Chip tone={STATUS_CHIP_TONE[status]}>
                      {STATUS_LABEL[status]}
                    </Chip>
                  )}
                </div>
              ))}
              {filtered_roster.length === 0 && (
                <div className="histEmpty">
                  Ningún alumno coincide con "{name_filter}".
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {student_history_id && (() => {
        const s = students.find((x) => x.id_student === student_history_id);
        if (!s) return null;
        const records = days.map((d) => ({
          day: d,
          status: statusOnDay(s, d, rosterStatus[s.id_student] ?? "present"),
        }));
        const totals = { present: 0, late: 0, absent: 0 };
        records.forEach((r) => {
          totals[r.status] += 1;
        });
        return (
          <div className="modalOverlay" onClick={() => setStudentHistoryId(null)}>
            <div className="modalCard" onClick={(e) => e.stopPropagation()}>
              <div className="modalHead">
                <div className="histAlumnoHead">
                  <Avatar full_name={s.full_name} size={38} />
                  <div>
                    <div className="fichaName" style={{ fontSize: 16 }}>
                      {s.full_name}
                    </div>
                    <div className="fichaSub">Historial de asistencia</div>
                  </div>
                </div>
                <button
                  className="modalX"
                  onClick={() => setStudentHistoryId(null)}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              <div className="histSummary">
                <span style={{ color: "var(--green)" }}>{totals.present} presentes</span>
                <span style={{ color: "var(--amber)" }}>{totals.late} tardanzas</span>
                <span style={{ color: "var(--margin)" }}>{totals.absent} faltas</span>
              </div>
              <div className="histTL">
                {records.map(({ day, status }) => (
                  <div key={day.iso} className="histTLRow">
                    <span className="histTLFecha">
                      {day.label}
                      {day.is_today ? " · Hoy" : ""}
                    </span>
                    <Chip tone={STATUS_CHIP_TONE[status]}>
                      {STATUS_LABEL[status]}
                    </Chip>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {voice_open && (
        <AttendanceVoiceModal
          students={students}
          current_by_student={rosterStatus}
          onClose={() => setVoiceOpen(false)}
          onConfirm={(proposed) => {
            setRosterStatus(proposed);
            setVoiceOpen(false);
            setConfirmed(false);
          }}
        />
      )}
    </div>
  );
}

