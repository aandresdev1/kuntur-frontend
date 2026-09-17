import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/Card";
import { MockBadge } from "@/components/MockBadge";
import { useSession } from "@/contexts/SessionContext";
import {
  SCHOOL_PRESENTATION,
  type SubscriptionPlan,
} from "@/data/schools";
import { PLATFORM_MODULES } from "@/data/platformModules";
import { formatIsoDateEs } from "@/lib/dateFormat";
import { ApiError } from "@/lib/api";
import { listSchools } from "@/lib/api/schools";
import { listSchoolModules } from "@/lib/api/schoolModules";
import type { ModuleKey } from "@/lib/modules";
import type { School, SchoolModule, UUID } from "@/types/domain";

// Demo reference date matches monolith HOY_SA (App.jsx L4122) so day counts
// stay stable across environments. This drives the mock "licencias por vencer".
const REFERENCE_DATE = new Date("2026-08-17T00:00:00");

function daysFromReference(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  return Math.round((target - REFERENCE_DATE.getTime()) / 86400000);
}

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  pilot: "Piloto",
  standard: "Estándar",
  institutional: "Institucional",
};

export default function SuperadminPanelPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  if (!session) return null;
  if (session.role !== "super_admin") return <Navigate to="/" replace />;

  const [schools, setSchools] = useState<School[]>([]);
  const [modulesBySchool, setModulesBySchool] = useState<
    Record<UUID, SchoolModule[]>
  >({});
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listSchools()
      .then(async (list) => {
        if (cancelled) return;
        setSchools(list);
        const results = await Promise.all(
          list.map((s) =>
            listSchoolModules(s.id_school)
              .then((m) => [s.id_school, m] as const)
              .catch(() => [s.id_school, [] as SchoolModule[]] as const),
          ),
        );
        if (cancelled) return;
        setModulesBySchool(
          Object.fromEntries(results) as Record<UUID, SchoolModule[]>,
        );
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el panorama de la plataforma.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSchools = useMemo(
    () => schools.filter((s) => s.status === "active"),
    [schools],
  );

  const totalActiveModules = useMemo(
    () =>
      Object.values(modulesBySchool).reduce(
        (a, arr) => a + arr.filter((m) => m.enabled).length,
        0,
      ),
    [modulesBySchool],
  );

  // Mock aggregates — depend on SCHOOL_PRESENTATION which is keyed by demo ids.
  // Real backend schools created by the user won't have a presentation row, so
  // the counts here only reflect the seeded demo entries.
  const totalStudents = schools.reduce(
    (a, s) => a + (SCHOOL_PRESENTATION[s.id_school]?.student_count ?? 0),
    0,
  );
  const totalTeachers = schools.reduce(
    (a, s) => a + (SCHOOL_PRESENTATION[s.id_school]?.teacher_count ?? 0),
    0,
  );

  const suspendedSchools = schools.filter((s) => {
    const p = SCHOOL_PRESENTATION[s.id_school];
    return p?.subscription_status === "suspended";
  });
  const expiringSoon = schools.filter((s) => {
    const p = SCHOOL_PRESENTATION[s.id_school];
    if (!p) return false;
    return daysFromReference(p.subscription_expires_at) <= 60;
  });
  const nearLimit = schools.filter((s) => {
    const p = SCHOOL_PRESENTATION[s.id_school];
    return p && p.student_count / p.student_limit > 0.9;
  });

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Plataforma.</div>
        <div className="pageSub">Cargando panorama…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Plataforma.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Plataforma.</div>
      <div className="pageSub">
        {schools.length} colegios · {PLATFORM_MODULES.length} módulos
        disponibles ·{" "}
        <span>
          {totalStudents.toLocaleString("es-PE")} alumnos
          <MockBadge />
        </span>
      </div>

      <div className="saStats">
        <div className="saStat">
          <div className="saStatLbl">Colegios activos</div>
          <div className="saStatNum">{activeSchools.length}</div>
          <div className="saStatSub">
            de {schools.length} registrados
          </div>
        </div>
        <div className="saStat">
          <div className="saStatLbl">
            Alumnos en plataforma
            <MockBadge />
          </div>
          <div className="saStatNum">
            {totalStudents.toLocaleString("es-PE")}
          </div>
          <div className="saStatSub">
            {totalTeachers} docentes con cuenta
          </div>
        </div>
        <div className="saStat">
          <div className="saStatLbl">Módulos contratados</div>
          <div className="saStatNum">{totalActiveModules}</div>
          <div className="saStatSub">
            promedio{" "}
            {schools.length > 0
              ? (totalActiveModules / schools.length).toFixed(1)
              : "0.0"}{" "}
            por colegio
          </div>
        </div>
        <div className="saStat">
          <div className="saStatLbl">
            Licencias por vencer
            <MockBadge />
          </div>
          <div
            className="saStatNum"
            style={{
              color: expiringSoon.length ? "var(--amber)" : undefined,
            }}
          >
            {expiringSoon.length}
          </div>
          <div className="saStatSub">en los próximos 60 días</div>
        </div>
      </div>

      <div className="grid2">
        <Card>
          <div className="cardEyebrow">
            Atención requerida
            <MockBadge />
          </div>
          {suspendedSchools.map((s) => {
            const p = SCHOOL_PRESENTATION[s.id_school]!;
            return (
              <div className="alertItem" key={"s" + s.id_school}>
                <span className="dot" style={{ background: "var(--margin)" }} />
                <div>
                  <strong>{s.name}</strong> está suspendido desde el vencimiento
                  de su licencia.
                  <div className="alertSub">
                    Vence: {formatIsoDateEs(p.subscription_expires_at)} ·{" "}
                    {p.student_count} alumnos sin acceso.
                  </div>
                </div>
              </div>
            );
          })}
          {expiringSoon
            .filter((s) => {
              const p = SCHOOL_PRESENTATION[s.id_school];
              return p?.subscription_status !== "suspended";
            })
            .map((s) => {
              const p = SCHOOL_PRESENTATION[s.id_school]!;
              const dias = daysFromReference(p.subscription_expires_at);
              return (
                <div className="alertItem" key={"v" + s.id_school}>
                  <span className="dot" style={{ background: "var(--amber)" }} />
                  <div>
                    <strong>{s.name}</strong> vence en {dias} días.
                    <div className="alertSub">
                      Plan {PLAN_LABEL[p.plan]} · renovar antes del{" "}
                      {formatIsoDateEs(p.subscription_expires_at)}.
                    </div>
                  </div>
                </div>
              );
            })}
          {nearLimit.map((s) => {
            const p = SCHOOL_PRESENTATION[s.id_school]!;
            return (
              <div className="alertItem" key={"l" + s.id_school}>
                <span className="dot" style={{ background: "var(--pen)" }} />
                <div>
                  <strong>{s.name}</strong> usa{" "}
                  {Math.round((p.student_count / p.student_limit) * 100)}% de su
                  límite de alumnos.
                  <div className="alertSub">
                    {p.student_count} de {p.student_limit} · conviene ampliar el
                    plan.
                  </div>
                </div>
              </div>
            );
          })}
          {suspendedSchools.length === 0 &&
            expiringSoon.length === 0 &&
            nearLimit.length === 0 && (
              <div className="histEmpty">
                Sin alertas activas en la plataforma.
              </div>
            )}
        </Card>

        <Card>
          <div className="cardEyebrow">Módulos por adopción</div>
          <div className="saUso">
            {PLATFORM_MODULES.map((m) => {
              const n = schools.filter((s) =>
                (modulesBySchool[s.id_school] ?? []).some(
                  (row) =>
                    row.module_key === (m.module_key as ModuleKey) &&
                    row.enabled,
                ),
              ).length;
              return (
                <div className="saUsoRow" key={m.module_key}>
                  <div>
                    <div className="saUsoName">{m.label}</div>
                    <div className="saBar">
                      <span
                        style={{
                          width: `${
                            schools.length > 0
                              ? (n / schools.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="saUsoNum">
                    {n} de {schools.length}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hintSmall" style={{ marginTop: 12 }}>
            <button
              className="saAllBtn"
              onClick={() => navigate("/schools")}
            >
              Ver colegios →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
