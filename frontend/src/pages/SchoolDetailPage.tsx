import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Card } from "@/components/Card";
import { MockBadge } from "@/components/MockBadge";
import { StatusTag, type StatusTagTone } from "@/components/StatusTag";
import { Switch } from "@/components/Switch";
import { useSession } from "@/contexts/SessionContext";
import {
  SCHOOL_PRESENTATION,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/data/schools";
import { PLATFORM_MODULES } from "@/data/platformModules";
import { Chip } from "@/components/Chip";
import { formatIsoDateEs, daysUntil } from "@/lib/dateFormat";
import type { ModuleKey } from "@/lib/modules";
import { ApiError } from "@/lib/api";
import { getSchool } from "@/lib/api/schools";
import {
  listSchoolModules,
  setSchoolModule,
} from "@/lib/api/schoolModules";
import type { School, UUID } from "@/types/domain";

const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  pilot: "Piloto",
  standard: "Estándar",
  institutional: "Institucional",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Activo",
  trial: "Prueba",
  suspended: "Suspendido",
};

const STATUS_TONE: Record<SubscriptionStatus, StatusTagTone> = {
  active: "ok",
  trial: "trial",
  suspended: "off",
};

export default function SchoolDetailPage() {
  const { session } = useSession();
  const { id_school } = useParams<{ id_school: UUID }>();

  if (!session) return null;
  if (session.role !== "super_admin") return <Navigate to="/" replace />;
  if (!id_school) return <Navigate to="/schools" replace />;

  const CORE_MODULE_KEYS = useMemo<Set<ModuleKey>>(
    () =>
      new Set(
        PLATFORM_MODULES.filter((m) => m.is_core).map((m) => m.module_key),
      ),
    [],
  );

  const [school, setSchool] = useState<School | null>(null);
  const [moduleToggles, setModuleToggles] = useState<Set<ModuleKey>>(new Set());
  const [pendingKey, setPendingKey] = useState<ModuleKey | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "not_found" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");
  const [toggleError, setToggleError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    Promise.all([getSchool(id_school), listSchoolModules(id_school)])
      .then(([s, modules]) => {
        if (cancelled) return;
        setSchool(s);
        // Núcleo se considera implícito on cuando no hay fila; una fila
        // explícita (incluso para núcleo) manda sobre ese default.
        const next = new Set<ModuleKey>(CORE_MODULE_KEYS);
        for (const m of modules) {
          const key = m.module_key as ModuleKey;
          if (m.enabled) next.add(key);
          else next.delete(key);
        }
        setModuleToggles(next);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setLoadStatus("not_found");
          return;
        }
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el colegio.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id_school]);

  const presentation = useMemo(
    () => (school ? SCHOOL_PRESENTATION[school.id_school] ?? null : null),
    [school],
  );

  const toggleModule = async (key: ModuleKey) => {
    if (pendingKey) return;
    const nextEnabled = !moduleToggles.has(key);
    setPendingKey(key);
    setToggleError("");
    // Optimistic update
    setModuleToggles((prev) => {
      const next = new Set(prev);
      if (nextEnabled) next.add(key);
      else next.delete(key);
      return next;
    });
    try {
      await setSchoolModule(id_school, key, nextEnabled);
    } catch (err) {
      // Rollback
      setModuleToggles((prev) => {
        const next = new Set(prev);
        if (nextEnabled) next.delete(key);
        else next.add(key);
        return next;
      });
      setToggleError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el módulo.",
      );
    } finally {
      setPendingKey(null);
    }
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="crumbs">
          <Link to="/schools">Colegios</Link>
        </div>
        <div className="pageTitle">Cargando…</div>
      </div>
    );
  }

  if (loadStatus === "not_found") {
    return (
      <div>
        <div className="pageTitle">Colegio no encontrado.</div>
        <Link to="/schools" className="btnGhost">
          ← Volver a colegios
        </Link>
      </div>
    );
  }

  if (loadStatus === "error" || !school) {
    return (
      <div>
        <div className="pageTitle">No se pudo cargar el colegio.</div>
        <div className="loginError" role="alert" style={{ marginTop: 12 }}>
          {loadError}
        </div>
        <Link to="/schools" className="btnGhost">
          ← Volver a colegios
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="crumbs">
        <Link to="/schools">Colegios</Link>
        <span>/</span>
        <span className="crumbsNow">{school.name}</span>
      </div>

      <div className="pageTitle">{school.name}.</div>
      <div className="pageSub">
        Registrado: {formatIsoDateEs(school.created_at.slice(0, 10))}
        {presentation && (
          <>
            {" · "}
            <span>
              {presentation.external_code} · {presentation.city} ·{" "}
              {PLAN_LABEL[presentation.plan]}
              <MockBadge />
            </span>
          </>
        )}
      </div>

      <div className="grid2">
        <Card>
          <div className="cardEyebrow">Estado del colegio</div>
          <div className="detGrid">
            <div className="detCell">
              <div className="detLbl">Estado</div>
              <div className="detVal">
                <StatusTag
                  tone={school.status === "active" ? "ok" : "off"}
                  label={school.status === "active" ? "Activo" : "Inactivo"}
                />
              </div>
            </div>
            <div className="detCell">
              <div className="detLbl">ID interno</div>
              <div className="detVal" style={{ fontFamily: "monospace" }}>
                {school.id_school}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="cardEyebrow">
            Suscripción
            <MockBadge />
          </div>
          {presentation ? (
            <div className="detGrid">
              <div className="detCell">
                <div className="detLbl">Estado</div>
                <div className="detVal">
                  <StatusTag
                    tone={STATUS_TONE[presentation.subscription_status]}
                    label={STATUS_LABEL[presentation.subscription_status]}
                  />
                </div>
              </div>
              <div className="detCell">
                <div className="detLbl">Plan</div>
                <div className="detVal">{PLAN_LABEL[presentation.plan]}</div>
              </div>
              <div className="detCell">
                <div className="detLbl">Vence</div>
                <div className="detVal">
                  {formatIsoDateEs(presentation.subscription_expires_at)}
                  {(() => {
                    const days = daysUntil(
                      presentation.subscription_expires_at,
                    );
                    return days >= 0 && days < 30 ? (
                      <div className="hintSmall">Vence en {days} días</div>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="detCell">
                <div className="detLbl">Dirección</div>
                <div className="detVal">
                  {presentation.admin_full_name}
                  <div className="hintSmall">{presentation.admin_email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hintSmall">
              Este colegio no tiene datos de suscripción de demostración.
            </div>
          )}
        </Card>
      </div>

      {presentation && (
        <Card>
          <div className="cardEyebrow">
            Uso
            <MockBadge />
          </div>
          <div className="detGrid">
            <div className="detCell">
              <div className="detLbl">Alumnos</div>
              <div className="detVal">
                {presentation.student_count} / {presentation.student_limit}
              </div>
            </div>
            <div className="detCell">
              <div className="detLbl">Aulas</div>
              <div className="detVal">{presentation.classroom_count}</div>
            </div>
            <div className="detCell">
              <div className="detLbl">Docentes</div>
              <div className="detVal">{presentation.teacher_count}</div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="cardEyebrow">Módulos</div>
        <div className="hint">
          Enciende o apaga módulos según el plan contratado por el colegio.
          Los módulos marcados como Núcleo se recomiendan siempre encendidos.
        </div>
        {toggleError && (
          <div className="loginError" role="alert" style={{ marginBottom: 12 }}>
            {toggleError}
          </div>
        )}
        <div className="modoGrid">
          {PLATFORM_MODULES.map((m) => {
            const on = moduleToggles.has(m.module_key);
            const pending = pendingKey === m.module_key;
            return (
              <label
                key={m.module_key}
                className={"modoCard" + (on ? " modoCardOn" : "")}
                style={pending ? { opacity: 0.6 } : undefined}
              >
                <span className={"modoIco" + (on ? " modoIcoOn" : "")}>⚡</span>
                <div className="modoTxt" style={{ flex: 1 }}>
                  <strong>
                    {m.label}
                    {m.is_core && <Chip tone="neutral">Núcleo</Chip>}
                  </strong>
                  <span>{m.description}</span>
                </div>
                <Switch
                  on={on}
                  onChange={() => toggleModule(m.module_key)}
                  label={`Activar ${m.label}`}
                  disabled={pending}
                />
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
