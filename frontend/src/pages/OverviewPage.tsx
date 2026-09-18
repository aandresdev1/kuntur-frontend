import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { useSession } from "@/contexts/SessionContext";
import {
  getDashboardSummary,
  type DashboardRecentObservation,
  type DashboardSummary,
} from "@/lib/api/dashboard";

export default function OverviewPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  if (!session) return null;
  if (session.role === "super_admin") return <Navigate to="/schools" replace />;
  if (session.role === "guardian") return <Navigate to="/portfolio" replace />;
  if (session.role === "teacher") return <Navigate to="/attendance" replace />;

  const attendancePct = summary?.attendance_today_pct;
  const attendanceLabel =
    attendancePct == null ? "—" : `${attendancePct}%`;
  const attendanceColor =
    attendancePct == null
      ? undefined
      : attendancePct >= 80
        ? "var(--green)"
        : attendancePct >= 60
          ? "var(--amber)"
          : "var(--margin)";

  if (error) {
    const friendlyError =
      error.includes("Cannot GET") || error === "Not Found"
        ? "No se pudo cargar el dashboard. Verifica la conexión con el servidor."
        : error;
    return (
      <div>
        <div className="pageTitle">Dashboard.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {friendlyError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Dashboard.</div>
      <div className="pageSub">Resumen del colegio · hoy</div>

      {/* Stats */}
      <div className="saStats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="saStat" style={{ borderTop: "3px solid var(--pen)" }}>
          <div className="saStatLbl">Alumnos</div>
          <div className="saStatNum" style={{ color: "var(--pen)" }}>
            {loading ? "…" : (summary?.students_count ?? "—")}
          </div>
          <div className="saStatSub">matriculados activos</div>
        </div>
        <div className="saStat" style={{ borderTop: "3px solid var(--amber)" }}>
          <div className="saStatLbl">Docentes</div>
          <div className="saStatNum" style={{ color: "var(--amber)" }}>
            {loading ? "…" : (summary?.teachers_count ?? "—")}
          </div>
          <div className="saStatSub">con cuenta en la plataforma</div>
        </div>
        <div className="saStat" style={{ borderTop: `3px solid ${attendanceColor ?? "var(--green)"}` }}>
          <div className="saStatLbl">Asistencia hoy</div>
          <div className="saStatNum" style={{ color: attendanceColor ?? "var(--green)" }}>
            {loading ? "…" : attendanceLabel}
          </div>
          <div className="saStatSub">
            {attendancePct == null ? "sin registros aún" : "presentes y tardanzas"}
          </div>
        </div>
      </div>

      {/* Main content: comunicados + observaciones */}
      <div className="grid2">
        {/* Comunicados */}
        <Card>
          <div className="cardEyebrow">Últimos comunicados</div>
          {loading ? (
            <div className="histEmpty">Cargando…</div>
          ) : !summary || summary.recent_announcements.length === 0 ? (
            <div className="histEmpty">No hay comunicados aún.</div>
          ) : (
            summary.recent_announcements.map((ann) => {
              const pct =
                ann.total_count === 0
                  ? 0
                  : Math.round((ann.reads_count / ann.total_count) * 100);
              const dotColor =
                pct >= 80
                  ? "var(--green)"
                  : pct >= 40
                    ? "var(--amber)"
                    : "var(--margin)";
              return (
                <div
                  key={ann.id_announcement}
                  className="alertItem"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/announcements")}
                >
                  <span className="dot" style={{ background: dotColor }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{ann.title}</strong>
                    <div className="alertSub">
                      {ann.classroom_label} · {ann.reads_count}/{ann.total_count} padres lo vieron
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Observaciones */}
        <Card>
          <div className="cardEyebrow">Últimas observaciones</div>
          {loading ? (
            <div className="histEmpty">Cargando…</div>
          ) : !summary || summary.recent_observations.length === 0 ? (
            <div className="histEmpty">No hay observaciones registradas aún.</div>
          ) : (
            summary.recent_observations.map((obs) => (
              <ObsRow key={obs.id_observation} obs={obs} />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function ObsRow({ obs }: { obs: DashboardRecentObservation }) {
  const date = new Date(obs.created_at);
  const dateLabel = date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="alertItem">
      <span className="dot" style={{ background: "var(--pen)", marginTop: 6 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>{obs.student_name}</strong>
        {" "}
        <span style={{ fontWeight: 400, color: "var(--ink-soft)", fontSize: "12.5px" }}>
          · {dateLabel}
        </span>
        <div className="alertSub">
          {obs.classroom_name} · {obs.competency_name} · por {obs.author_name}
        </div>
        <div style={{ fontSize: "13px", marginTop: "3px", color: "var(--ink-soft)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {obs.content}
        </div>
      </div>
    </div>
  );
}
