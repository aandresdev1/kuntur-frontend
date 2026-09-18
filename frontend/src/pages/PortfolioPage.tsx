import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useSession } from "@/contexts/SessionContext";
import { ApiError } from "@/lib/api";
import {
  confirmAnnouncement,
  familyFeed,
  guardianConclusions,
  myStudents,
  type DescriptiveConclusion,
  type FeedAnnouncement,
  type FeedAttendance,
  type FeedObservation,
  type FamilyFeedItem,
  type MyStudent,
} from "@/lib/api/guardian";
import type { ClassroomLevel } from "@/types/domain";

// ── Formatters ───────────────────────────────────────────────────────────────

const FMT_LONG = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" });
const FMT_SHORT = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric" });
const FMT_TIME = new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit" });
const FMT_WEEKDAY = new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short" });
const FMT_DAY_MONTH = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" });

function capitalize(s: string) { return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1); }
function clean(s: string) { return s.replace(/\.$/, "").replace(/,\s*$/, ""); }

function formatLevel(level: ClassroomLevel | null): string {
  if (!level) return "";
  if (level.startsWith("initial_")) return `Inicial ${level.slice(8)} años`;
  if (level.startsWith("primary_")) return `${level.slice(8)}° Primaria`;
  if (level.startsWith("secondary_")) return `${level.slice(10)}° Secundaria`;
  return level;
}

function ymdLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const t = FMT_TIME.format(d);
  if (sameDay(d, now)) return `Hoy · ${t}`;
  if (sameDay(d, yesterday)) return `Ayer · ${t}`;
  return `${clean(FMT_WEEKDAY.format(d))} · ${t}`;
}

const SCOPE_LABEL: Record<string, string> = {
  individual: "Para tu familia",
  classroom: "Todo el aula",
  multi_classroom: "Varias aulas",
  school_wide: "Todo el colegio",
};

const COMP_PALETTE = [
  { fg: "var(--pen)", bg: "#EDF2FF" },
  { fg: "var(--green)", bg: "#E8F5E9" },
  { fg: "var(--amber)", bg: "#FFF8E1" },
  { fg: "#7C3AED", bg: "#F5F3FF" },
];

function compColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COMP_PALETTE[h % COMP_PALETTE.length]!;
}

function attendanceView(status: "present" | "late" | "absent") {
  if (status === "present") return { label: "Presente", sub: "Asistió a la jornada", bg: "#E8F5E9", color: "var(--green)", glyph: "✓" };
  if (status === "late") return { label: "Tarde", sub: "Llegó tarde a la jornada", bg: "#FFF8E1", color: "var(--amber)", glyph: "◔" };
  return { label: "No asistió", sub: "No estuvo presente hoy", bg: "#FDE8E8", color: "#C0392B", glyph: "×" };
}

function primerNombre(full: string) { return full.trim().split(/\s+/)[0] ?? full; }

// ── Inline style helpers ─────────────────────────────────────────────────────

const rowSt: React.CSSProperties = { display: "flex", gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: "1px solid var(--line)" };
const glyphSt: React.CSSProperties = { width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const kickerSt: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" };
const valueSt: React.CSSProperties = { fontSize: 15, fontWeight: 500, lineHeight: 1.35, color: "var(--ink)", marginTop: 3 };
const subSt: React.CSSProperties = { fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 };

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "hoy" | "cuaderno" | "observaciones" | "conclusiones";

// ── Component ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { session } = useSession();

  const [students, setStudents] = useState<MyStudent[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [feed, setFeed] = useState<FamilyFeedItem[]>([]);
  const [conclusions, setConclusions] = useState<DescriptiveConclusion[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [tab, setTab] = useState<Tab>("hoy");
  const [obsFilter, setObsFilter] = useState("__todas__");

  // Signing flow
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signingPwd, setSigningPwd] = useState("");
  const [signingError, setSigningError] = useState("");
  const [signingLoading, setSigningLoading] = useState(false);

  const student = students[selectedIdx] ?? null;

  useEffect(() => {
    myStudents()
      .then((data) => { setStudents(data); setLoadStatus("ready"); })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar la información.");
        setLoadStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!student) { setFeed([]); setConclusions([]); return; }
    let cancelled = false;
    setFeedLoading(true);
    setFeedError("");

    Promise.all([
      familyFeed(student.id_student),
      guardianConclusions(student.id_student).catch(() => [] as DescriptiveConclusion[]),
    ]).then(([feedData, conclusionData]) => {
      if (!cancelled) {
        setFeed(feedData);
        setConclusions(conclusionData);
      }
    }).catch((err) => {
      if (!cancelled) setFeedError(err instanceof ApiError ? err.message : "No se pudo cargar el resumen.");
    }).finally(() => {
      if (!cancelled) setFeedLoading(false);
    });

    return () => { cancelled = true; };
  }, [student?.id_student]);

  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => ymdLocal(today), [today]);

  const todayAttendance = useMemo<FeedAttendance | null>(() => {
    const item = feed.find((f) => f.kind === "attendance" && f.at.slice(0, 10) === todayYmd);
    return item ? (item.payload as FeedAttendance) : null;
  }, [feed, todayYmd]);

  const allObservations = useMemo<FeedObservation[]>(
    () => feed.filter((f) => f.kind === "observation").map((f) => f.payload as FeedObservation),
    [feed],
  );
  const todayObs = useMemo(
    () => allObservations.filter((o) => sameDay(new Date(o.created_at), today)),
    [allObservations, today],
  );
  const allAnnouncements = useMemo<FeedAnnouncement[]>(
    () => feed.filter((f) => f.kind === "announcement").map((f) => f.payload as FeedAnnouncement),
    [feed],
  );
  const pendingCount = useMemo(
    () => allAnnouncements.filter((a) => a.type === "authorization" && !a.confirmed_at).length,
    [allAnnouncements],
  );
  const competencies = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of allObservations) map.set(o.competency.id_competency, o.competency.name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allObservations]);
  const filteredObs = useMemo(
    () => obsFilter === "__todas__" ? allObservations : allObservations.filter((o) => o.competency.id_competency === obsFilter),
    [allObservations, obsFilter],
  );

  const patchAnnouncement = useCallback((id: string, patch: Partial<FeedAnnouncement>) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.kind !== "announcement") return item;
        if ((item.payload as FeedAnnouncement).id_announcement !== id) return item;
        return { ...item, payload: { ...(item.payload as FeedAnnouncement), ...patch } };
      }),
    );
  }, []);

  const handleSign = async (id: string) => {
    if (!signingPwd) { setSigningError("Ingresa tu contraseña para confirmar."); return; }
    setSigningLoading(true);
    setSigningError("");
    try {
      const res = await confirmAnnouncement(id, signingPwd);
      patchAnnouncement(id, { confirmed_at: res.confirmed_at });
      setSigningId(null);
      setSigningPwd("");
    } catch (err) {
      setSigningError(
        err instanceof ApiError && err.status === 401
          ? "Contraseña incorrecta. Intenta de nuevo."
          : err instanceof ApiError ? err.message : "No se pudo firmar.",
      );
    } finally {
      setSigningLoading(false);
    }
  };

  // ── Early states ─────────────────────────────────────────────────────────

  if (loadStatus === "loading") {
    return <div><div className="pageTitle">Portafolio.</div><div className="pageSub">Cargando…</div></div>;
  }
  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Portafolio.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>{loadError}</div>
      </div>
    );
  }
  if (students.length === 0) {
    return (
      <div>
        <div className="pageTitle">Portafolio.</div>
        <Card style={{ marginTop: 16 }}>
          <div className="histEmpty">
            Tu cuenta no tiene alumnos vinculados. Escribe a la dirección del colegio para que te vinculen con tu hijo(a).
          </div>
        </Card>
      </div>
    );
  }

  // ── Derived display ───────────────────────────────────────────────────────

  const nombre = primerNombre(student?.full_name ?? "");
  const aulaName = student?.classroom?.name ?? "Sin aula";
  const nivel = formatLevel(student?.classroom?.level ?? null);
  const aulaCorta = nivel ? `${aulaName} · ${nivel}` : aulaName;
  const subtitulo = session?.school_name ? `${aulaCorta} · ${session.school_name}` : aulaCorta;
  const fechaHoy = capitalize(clean(FMT_LONG.format(today)));

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 2 }}>
        <Avatar full_name={student?.full_name ?? ""} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pageTitle" style={{ marginBottom: 0 }}>{nombre}.</div>
          <div className="pageSub" style={{ marginBottom: 0 }}>{subtitulo}</div>
        </div>
        {students.length > 1 && (
          <select
            className="input"
            style={{ width: "auto", fontSize: 13, marginTop: 6 }}
            value={selectedIdx}
            onChange={(e) => { setSelectedIdx(Number(e.target.value)); setObsFilter("__todas__"); }}
          >
            {students.map((s, i) => (
              <option key={s.id_student} value={i}>{s.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Tabs ── */}
      <nav className="tabs">
        <button className={"tab" + (tab === "hoy" ? " tabActive" : "")} onClick={() => setTab("hoy")}>Hoy</button>
        <button className={"tab" + (tab === "cuaderno" ? " tabActive" : "")} onClick={() => setTab("cuaderno")}>
          Cuaderno{pendingCount > 0 ? ` (${pendingCount})` : ""}
        </button>
        <button className={"tab" + (tab === "observaciones" ? " tabActive" : "")} onClick={() => setTab("observaciones")}>
          Observaciones
        </button>
        <button className={"tab" + (tab === "conclusiones" ? " tabActive" : "")} onClick={() => setTab("conclusiones")}>
          Conclusiones{conclusions.length > 0 ? ` · ${conclusions.length}` : ""}
        </button>
      </nav>

      {feedError && (
        <div className="loginError" role="alert" style={{ marginBottom: 12 }}>{feedError}</div>
      )}

      {/* ══════════════════════════════════════════ HOY ══════════════════════════════════════════ */}
      {tab === "hoy" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="pageSub" style={{ margin: 0, fontSize: 14 }}>Su día de hoy</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{fechaHoy}</div>
          </div>

          <div className="grid2">
            {/* Columna izquierda: asistencia + observaciones de hoy */}
            <Card>
              <div className="cardEyebrow">Registro del día</div>
              {feedLoading && !todayAttendance && todayObs.length === 0 ? (
                <div className="histEmpty">Cargando…</div>
              ) : !todayAttendance && todayObs.length === 0 ? (
                <div className="histEmpty">Aún no hay registros para hoy.</div>
              ) : (
                <>
                  {todayAttendance && (() => {
                    const v = attendanceView(todayAttendance.status);
                    return (
                      <div style={rowSt}>
                        <div style={{ ...glyphSt, background: v.bg }}>
                          <span style={{ fontSize: 18, color: v.color }}>{v.glyph}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={kickerSt}>Asistencia</div>
                          <div style={valueSt}>{v.label}</div>
                          <div style={subSt}>{v.sub}</div>
                        </div>
                      </div>
                    );
                  })()}
                  {todayObs.map((o, i) => (
                    <div key={o.id_observation} style={{ ...rowSt, ...(i === todayObs.length - 1 ? { borderBottom: "none" } : {}) }}>
                      <div style={{ ...glyphSt, background: "#EDF2FF" }}>
                        <span style={{ fontSize: 18, color: "var(--pen)" }}>✎</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={kickerSt}>{o.competency.name}</div>
                        <div style={valueSt}>{o.content}</div>
                        <div style={subSt}>{FMT_TIME.format(new Date(o.created_at))} · {o.author.full_name}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Card>

            {/* Columna derecha: nota destacada + comunicados pendientes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {todayObs.length > 0 ? (
                <Card style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 16, bottom: 16, width: 3, background: "var(--amber)", borderRadius: "0 3px 3px 0" }} />
                  <div className="cardEyebrow">Nota de la docente</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink)", marginTop: 6 }}>
                    {todayObs[0]!.content}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 10 }}>
                    — {todayObs[0]!.author.full_name}
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="cardEyebrow">Nota de la docente</div>
                  <div className="histEmpty">Sin notas registradas hoy.</div>
                </Card>
              )}

              {pendingCount > 0 && (
                <Card style={{ borderLeft: "3px solid var(--amber)", borderRadius: "0 8px 8px 0" }}>
                  <div className="cardEyebrow" style={{ color: "var(--amber)" }}>Autorizaciones pendientes</div>
                  <div style={{ fontSize: 14, color: "var(--ink)", marginTop: 4 }}>
                    Tienes <strong>{pendingCount}</strong> autorización{pendingCount > 1 ? "es" : ""} por firmar.
                  </div>
                  <button className="btn" style={{ marginTop: 10, width: "100%" }} onClick={() => setTab("cuaderno")}>
                    Ver cuaderno
                  </button>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ CUADERNO ═══════════════════════════════════════ */}
      {tab === "cuaderno" && (
        <div>
          {feedLoading && allAnnouncements.length === 0 ? (
            <div className="histEmpty">Cargando comunicados…</div>
          ) : allAnnouncements.length === 0 ? (
            <Card>
              <div className="histEmpty">
                Aún no hay comunicados para {nombre}. Cuando el colegio envíe algo, aparecerá aquí.
              </div>
            </Card>
          ) : (
            <div className="hojas">
              {allAnnouncements.map((ann) => {
                const esAut = ann.type === "authorization";
                const firmado = esAut ? !!ann.confirmed_at : null;
                const isSigning = signingId === ann.id_announcement;

                return (
                  <div key={ann.id_announcement} className={"hoja" + (esAut && firmado === false ? " hojaPend" : "")}>
                    <div className="hojaHead">
                      <div>
                        <div className="hojaMeta">
                          {clean(FMT_DAY_MONTH.format(new Date(ann.created_at)))} · {esAut ? "Autorización" : "Comunicado"}
                          <span className="alcanceTag">{SCOPE_LABEL[ann.scope] ?? ann.scope}</span>
                        </div>
                        <div className="hojaTitulo">{ann.title}</div>
                      </div>
                      {esAut && (
                        <Chip tone={firmado ? "green" : "amber"}>
                          {firmado ? "Firmado ✓" : "Pendiente"}
                        </Chip>
                      )}
                    </div>

                    <div className="hojaBody">{ann.content}</div>

                    <div className="hojaFoot">
                      <span className="hojaCount">— {ann.author.full_name}</span>
                    </div>

                    {/* Solo autorizaciones tienen CTA */}
                    {esAut && !firmado && !isSigning && (
                      <button
                        className="btn"
                        style={{ marginTop: 12, width: "100%" }}
                        onClick={() => { setSigningId(ann.id_announcement); setSigningPwd(""); setSigningError(""); }}
                      >
                        Firmar autorización
                      </button>
                    )}

                    {isSigning && (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                          Ingresa tu contraseña para firmar esta autorización.
                        </div>
                        <input
                          className="input"
                          type="password"
                          placeholder="Contraseña"
                          value={signingPwd}
                          autoFocus
                          style={{ width: "100%", boxSizing: "border-box" }}
                          onChange={(e) => setSigningPwd(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleSign(ann.id_announcement); }}
                        />
                        {signingError && <div className="loginError" role="alert">{signingError}</div>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btnGhost" onClick={() => { setSigningId(null); setSigningPwd(""); setSigningError(""); }}>
                            Cancelar
                          </button>
                          <button className="btn" style={{ flex: 1 }} disabled={signingLoading} onClick={() => void handleSign(ann.id_announcement)}>
                            {signingLoading ? "Firmando…" : "Confirmar firma"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
            Las autorizaciones firmadas quedan con fecha y hora en el expediente del colegio.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ OBSERVACIONES ══════════════════════════════════ */}
      {tab === "observaciones" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="pageSub" style={{ margin: 0, fontSize: 14 }}>
              Lo que la docente registró de {nombre} · {filteredObs.length === 1 ? "1 registro" : `${filteredObs.length} registros`}
            </div>
          </div>

          {competencies.length > 1 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
              {[{ id: "__todas__", name: "Todas" }, ...competencies].map((c) => {
                const active = obsFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setObsFilter(c.id)}
                    style={{
                      padding: "5px 13px", borderRadius: 999, border: "1.5px solid",
                      borderColor: active ? "var(--ink)" : "var(--line)",
                      background: active ? "var(--ink)" : "#fff",
                      color: active ? "#fff" : "var(--ink-soft)",
                      fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {feedLoading && allObservations.length === 0 ? (
            <div className="histEmpty">Cargando observaciones…</div>
          ) : filteredObs.length === 0 ? (
            <Card>
              <div className="histEmpty">
                {allObservations.length === 0
                  ? `Aún no hay observaciones registradas para ${nombre}.`
                  : "Sin registros en este filtro."}
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredObs.map((o, i) => {
                const c = compColor(o.competency.name);
                return (
                  <div key={o.id_observation} style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 12, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 19 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: c.fg, flexShrink: 0 }} />
                      {i < filteredObs.length - 1 && <div style={{ flex: 1, width: 1.5, background: "var(--line)", marginTop: 5 }} />}
                    </div>
                    <div style={{ flex: 1, marginBottom: 11 }}>
                      <Card>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {relativeDate(o.created_at)}
                          </span>
                          <span style={{ marginLeft: "auto", background: c.bg, color: c.fg, fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: "2px 9px" }}>
                            {o.source === "voice" ? "🎙 Voz" : "Texto"}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{o.content}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)", fontSize: 11.5, color: "var(--ink-soft)" }}>
                          <span style={{ background: c.bg, color: c.fg, fontWeight: 700, fontSize: 10.5, borderRadius: 999, padding: "2px 8px" }}>
                            {o.competency.name}
                          </span>
                          · {o.author.full_name}
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
            Cada registro se vincula a una competencia del Currículo Nacional.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ CONCLUSIONES ═════════════════════════════════ */}
      {tab === "conclusiones" && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div className="pageSub" style={{ margin: 0, fontSize: 14 }}>
              Conclusiones descriptivas de {nombre} · redactadas por la docente con apoyo de IA
            </div>
          </div>

          {feedLoading && conclusions.length === 0 ? (
            <div className="histEmpty">Cargando conclusiones…</div>
          ) : conclusions.length === 0 ? (
            <Card>
              <div className="histEmpty">
                Aún no hay conclusiones descriptivas para {nombre}. La docente las genera a partir de las observaciones registradas.
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {conclusions.map((c, i) => (
                <Card key={c.id_descriptive_conclusion} style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--pen)", borderRadius: "0 0 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span className="cardEyebrow">Conclusión #{conclusions.length - i}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                      {clean(FMT_SHORT.format(new Date(c.confirmed_at)))}
                    </span>
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
                    {c.content}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                    Confirmado por {c.confirmer.full_name} · {clean(FMT_SHORT.format(new Date(c.confirmed_at)))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
