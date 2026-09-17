import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { MockBadge } from "@/components/MockBadge";
import { Pagination } from "@/components/Pagination";
import { Switch } from "@/components/Switch";
import { useSession } from "@/contexts/SessionContext";
import {
  SCHOOL_PRESENTATION,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/data/schools";
import { CORE_MODULES, PLATFORM_MODULES } from "@/data/platformModules";
import type { ModuleKey } from "@/lib/modules";
import { formatIsoDateEs } from "@/lib/dateFormat";
import { ApiError } from "@/lib/api";
import { createSchool, listSchools, updateSchool } from "@/lib/api/schools";
import {
  listSchoolModules,
  setSchoolModule,
} from "@/lib/api/schoolModules";
import type { School, SchoolModule, SchoolStatus } from "@/types/domain";

const CORE_MODULE_KEYS: Set<ModuleKey> = new Set(
  CORE_MODULES.map((m) => m.module_key),
);

// Núcleo se considera implícito on cuando no existe fila en SchoolModule (ver
// ModuleGuard). Una fila explícita — incluso para núcleo — manda sobre el
// implícito, así que respetamos row.enabled tal cual, agregando o quitando.
function modulesFromRows(rows: SchoolModule[]): Set<ModuleKey> {
  const enabled = new Set<ModuleKey>(CORE_MODULE_KEYS);
  for (const row of rows) {
    const key = row.module_key as ModuleKey;
    if (row.enabled) enabled.add(key);
    else enabled.delete(key);
  }
  return enabled;
}

// Demo reference date matches monolith HOY_SA (App.jsx L4122).
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

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Activo",
  trial: "Prueba",
  suspended: "Suspendido",
};

const PLAN_OPTIONS: SubscriptionPlan[] = ["pilot", "standard", "institutional"];
const STATUS_OPTIONS: SubscriptionStatus[] = ["active", "trial", "suspended"];

interface SchoolRow {
  id_school: string;
  name: string;
  entity_status: SchoolStatus; // real: from backend
  external_code: string;
  city: string;
  plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  student_count: number;
  student_limit: number;
  teacher_count: number;
  classroom_count: number;
  subscription_expires_at: string;
  admin_full_name: string;
  admin_email: string;
  modules: Set<ModuleKey>;
  is_new?: boolean;
}

interface Filters {
  plan: string;
  status: string;
  module: string;
  expiring: boolean;
}

const EMPTY_FILTERS: Filters = {
  plan: "",
  status: "",
  module: "",
  expiring: false,
};

interface SchoolPopupState extends Omit<SchoolRow, "modules"> {
  modules: Set<ModuleKey>;
  initial_modules: Set<ModuleKey>;
  is_creating: boolean;
}

// Hydrates a backend School with mock presentation fields (plan, subscription,
// counts, admin) — everything not yet modeled by the backend. Newly created
// schools that have no mock entry get sensible defaults. `modules` comes from
// the SchoolModule API (activables) plus the core set, which is always on.
function toRow(s: School, moduleRows: SchoolModule[]): SchoolRow {
  const p = SCHOOL_PRESENTATION[s.id_school];
  return {
    id_school: s.id_school,
    name: s.name,
    entity_status: s.status,
    external_code: p?.external_code ?? "—",
    city: p?.city ?? "—",
    plan: p?.plan ?? "pilot",
    subscription_status: p?.subscription_status ?? "trial",
    student_count: p?.student_count ?? 0,
    student_limit: p?.student_limit ?? 60,
    teacher_count: p?.teacher_count ?? 0,
    classroom_count: p?.classroom_count ?? 0,
    subscription_expires_at: p?.subscription_expires_at ?? "2027-03-31",
    admin_full_name: p?.admin_full_name ?? "",
    admin_email: p?.admin_email ?? "",
    modules: modulesFromRows(moduleRows),
  };
}

const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
  </svg>
);
const FILTER_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" />
  </svg>
);
const IMPORT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 19h16" />
  </svg>
);
const SCHOOL_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-5h6v5" />
  </svg>
);

export default function SchoolsListPage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role !== "super_admin") return <Navigate to="/" replace />;

  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string>("");
  const [busc, setBusc] = useState("");
  const [buscDraft, setBuscDraft] = useState("");
  const [filtros, setFiltros] = useState<Filters>(EMPTY_FILTERS);
  const [filtrosDraft, setFiltrosDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filtroPanel, setFiltroPanel] = useState(false);
  const [popup, setPopup] = useState<SchoolPopupState | null>(null);
  const [popupTab, setPopupTab] = useState<"datos" | "modulos">("datos");
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    let cancelled = false;
    listSchools()
      .then(async (schools) => {
        if (cancelled) return;
        const moduleLists = await Promise.all(
          schools.map((s) =>
            listSchoolModules(s.id_school).catch(() => [] as SchoolModule[]),
          ),
        );
        if (cancelled) return;
        setRows(schools.map((s, i) => toRow(s, moduleLists[i])));
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la lista de colegios.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activos = rows.filter((r) => r.subscription_status === "active");
  const porVencer = rows.filter(
    (r) => daysFromReference(r.subscription_expires_at) <= 60,
  );

  const q = busc.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (
      q &&
      !(
        r.name.toLowerCase().includes(q) ||
        r.external_code.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      )
    )
      return false;
    if (filtros.plan && r.plan !== filtros.plan) return false;
    if (filtros.status && r.subscription_status !== filtros.status) return false;
    if (filtros.module && !r.modules.has(filtros.module as ModuleKey))
      return false;
    if (filtros.expiring && daysFromReference(r.subscription_expires_at) > 60)
      return false;
    return true;
  });

  const activeFilterCount =
    (filtros.plan ? 1 : 0) +
    (filtros.status ? 1 : 0) +
    (filtros.module ? 1 : 0) +
    (filtros.expiring ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const openSchool = (r: SchoolRow) => {
    setPopup({
      ...r,
      modules: new Set(r.modules),
      initial_modules: new Set(r.modules),
      is_creating: false,
    });
    setPopupTab("datos");
    setPopupError("");
  };

  const openNew = () => {
    // Núcleo cuenta como on "de facto" en un colegio recién creado (sin filas
    // en SchoolModule). Lo reflejamos en initial_modules para que si el user
    // apaga un núcleo, el diff detecte el cambio y persista enabled=false.
    const initial = new Set<ModuleKey>(CORE_MODULE_KEYS);
    const startModules = new Set<ModuleKey>(initial);
    startModules.add("family_portfolio");
    setPopup({
      id_school: "",
      name: "",
      entity_status: "active",
      external_code: "",
      city: "",
      plan: "pilot",
      subscription_status: "trial",
      student_count: 0,
      student_limit: 60,
      teacher_count: 0,
      classroom_count: 0,
      subscription_expires_at: "2027-03-31",
      admin_full_name: "",
      admin_email: "",
      modules: startModules,
      initial_modules: initial,
      is_creating: true,
    });
    setPopupTab("datos");
    setPopupError("");
  };

  const persistModuleDiff = async (
    id_school: string,
    initial: Set<ModuleKey>,
    next: Set<ModuleKey>,
  ) => {
    const changes: { key: ModuleKey; enabled: boolean }[] = [];
    for (const m of PLATFORM_MODULES) {
      const before = initial.has(m.module_key);
      const after = next.has(m.module_key);
      if (before !== after) changes.push({ key: m.module_key, enabled: after });
    }
    for (const c of changes) {
      await setSchoolModule(id_school, c.key, c.enabled);
    }
  };

  const saveSchool = async () => {
    if (!popup || !popup.name.trim() || popupSaving) return;
    setPopupSaving(true);
    setPopupError("");
    try {
      if (popup.is_creating) {
        const created = await createSchool({
          name: popup.name.trim(),
          status: popup.entity_status,
        });
        await persistModuleDiff(
          created.id_school,
          popup.initial_modules,
          popup.modules,
        );
        const { is_creating: _skip, initial_modules: _sk2, ...uiOnly } = popup;
        void _skip;
        void _sk2;
        setRows((prev) => [
          ...prev,
          {
            ...uiOnly,
            id_school: created.id_school,
            name: created.name,
            entity_status: created.status,
            modules: new Set(popup.modules),
            is_new: true,
          },
        ]);
      } else {
        const updated = await updateSchool(popup.id_school, {
          name: popup.name.trim(),
          status: popup.entity_status,
        });
        await persistModuleDiff(
          updated.id_school,
          popup.initial_modules,
          popup.modules,
        );
        const { is_creating: _skip, initial_modules: _sk2, ...uiOnly } = popup;
        void _skip;
        void _sk2;
        setRows((prev) =>
          prev.map((r) =>
            r.id_school === updated.id_school
              ? {
                  ...uiOnly,
                  id_school: updated.id_school,
                  name: updated.name,
                  entity_status: updated.status,
                  modules: new Set(popup.modules),
                }
              : r,
          ),
        );
      }
      setPopup(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el colegio.",
      );
    } finally {
      setPopupSaving(false);
    }
  };

  const toggleModule = (key: ModuleKey) => {
    setPopup((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.modules);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, modules: next };
    });
  };

  const applyImport = () => {
    // Demo import: nothing to persist here (would require the same 3-step flow).
    setImportOpen(false);
    setImportFile(null);
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Colegios.</div>
        <div className="pageSub">Cargando colegios…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Colegios.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Colegios.</div>
      <div className="pageSub">
        {rows.length} registrados · {activos.length} activos ·{" "}
        <span>
          {porVencer.length} con licencia por vencer
          <MockBadge />
        </span>
      </div>

      <div className="cuadHeader cuadHeaderTools">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
          <div className="searchBox searchBoxWide">
            <input
              className="input"
              placeholder="Buscar por nombre, código o ciudad…"
              value={buscDraft}
              onChange={(e) => setBuscDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setBusc(buscDraft);
                  setPage(1);
                }
              }}
            />
            <button
              className="searchBoxBtn"
              title="Buscar"
              aria-label="Buscar"
              onClick={() => {
                setBusc(buscDraft);
                setPage(1);
              }}
            >
              {SEARCH_ICON}
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
            {FILTER_ICON}
            Filtrar
            {activeFilterCount > 0 && (
              <span className="filtroBadge">{activeFilterCount}</span>
            )}
          </button>
          <button
            className="btnGhost btnLbl"
            title="Importar"
            aria-label="Importar colegios"
            onClick={() => setImportOpen(true)}
          >
            {IMPORT_ICON}
            Importar
          </button>
          <button className="btn" onClick={openNew}>
            + Nuevo colegio
          </button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="chipsBar">
          {filtros.plan && (
            <span className="filtroChip">
              Plan: {PLAN_LABEL[filtros.plan as SubscriptionPlan]}{" "}
              <button onClick={() => setFiltros({ ...filtros, plan: "" })}>✕</button>
            </span>
          )}
          {filtros.status && (
            <span className="filtroChip">
              Estado: {STATUS_LABEL[filtros.status as SubscriptionStatus]}{" "}
              <button onClick={() => setFiltros({ ...filtros, status: "" })}>✕</button>
            </span>
          )}
          {filtros.module && (
            <span className="filtroChip">
              Con módulo:{" "}
              {PLATFORM_MODULES.find((m) => m.module_key === filtros.module)?.label ??
                "—"}{" "}
              <button onClick={() => setFiltros({ ...filtros, module: "" })}>✕</button>
            </span>
          )}
          {filtros.expiring && (
            <span className="filtroChip">
              Licencia por vencer{" "}
              <button onClick={() => setFiltros({ ...filtros, expiring: false })}>✕</button>
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

      <Card className="cardFlush">
        {filtered.length === 0 ? (
          <div className="histEmpty">
            Ningún colegio coincide con la búsqueda o los filtros.
          </div>
        ) : (
          <div className="tableWrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Colegio</th>
                  <th>
                    Plan
                    <MockBadge />
                  </th>
                  <th>
                    Alumnos
                    <MockBadge />
                  </th>
                  <th>
                    Módulos
                    <MockBadge />
                  </th>
                  <th>Estado</th>
                  <th>
                    Suscripción
                    <MockBadge />
                  </th>
                  <th>
                    Licencia
                    <MockBadge />
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((c) => {
                  const dias = daysFromReference(c.subscription_expires_at);
                  return (
                    <tr
                      key={c.id_school}
                      className="tblRowClick"
                      onClick={() => openSchool(c)}
                    >
                      <td>
                        <div className="tdName">
                          <Avatar full_name={c.name} size={28} />
                          <span>
                            {c.name}
                            <span
                              style={{
                                display: "block",
                                fontSize: 12,
                                color: "var(--ink-soft, #5A6784)",
                                fontWeight: 400,
                              }}
                            >
                              {c.external_code} · {c.city}
                            </span>
                          </span>
                          {c.is_new && <Chip tone="green">nuevo</Chip>}
                        </div>
                      </td>
                      <td>
                        <span className="cellTag">{PLAN_LABEL[c.plan]}</span>
                      </td>
                      <td>
                        {c.student_count}{" "}
                        <span style={{ color: "var(--ink-soft, #5A6784)" }}>
                          / {c.student_limit}
                        </span>
                        <div className="saMiniBar">
                          <span
                            style={{
                              width: `${Math.min(100, (c.student_count / c.student_limit) * 100)}%`,
                              background:
                                c.student_count / c.student_limit > 0.9
                                  ? "var(--amber)"
                                  : "var(--pen)",
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="cellTag">
                          {c.modules.size} de {PLATFORM_MODULES.length}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "estTag " +
                            (c.entity_status === "active" ? "estOk" : "estOff")
                          }
                        >
                          {c.entity_status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            "estTag " +
                            (c.subscription_status === "active"
                              ? "estOk"
                              : c.subscription_status === "trial"
                                ? "estTrial"
                                : "estOff")
                          }
                        >
                          {STATUS_LABEL[c.subscription_status]}
                        </span>
                      </td>
                      <td className="tdMuted">
                        {formatIsoDateEs(c.subscription_expires_at)}
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color:
                              dias < 0
                                ? "var(--margin)"
                                : dias <= 60
                                  ? "var(--amber)"
                                  : "var(--ink-soft, #5A6784)",
                          }}
                        >
                          {dias < 0
                            ? `vencida hace ${Math.abs(dias)} d`
                            : `en ${dias} días`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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

      {filtroPanel && (
        <div className="modalOverlay" onClick={() => setFiltroPanel(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Filtros · Colegios
              </div>
              <button
                className="modalX"
                onClick={() => setFiltroPanel(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="saField">
                <label className="aulaLbl">Plan</label>
                <select
                  className="input"
                  value={filtrosDraft.plan}
                  onChange={(e) =>
                    setFiltrosDraft({ ...filtrosDraft, plan: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PLAN_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="saField">
                <label className="aulaLbl">Estado</label>
                <select
                  className="input"
                  value={filtrosDraft.status}
                  onChange={(e) =>
                    setFiltrosDraft({ ...filtrosDraft, status: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="saField">
                <label className="aulaLbl">Con el módulo</label>
                <select
                  className="input"
                  value={filtrosDraft.module}
                  onChange={(e) =>
                    setFiltrosDraft({ ...filtrosDraft, module: e.target.value })
                  }
                >
                  <option value="">Cualquiera</option>
                  {PLATFORM_MODULES.map((m) => (
                    <option key={m.module_key} value={m.module_key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={filtrosDraft.expiring}
                  onChange={(e) =>
                    setFiltrosDraft({
                      ...filtrosDraft,
                      expiring: e.target.checked,
                    })
                  }
                />
                Solo licencias que vencen en 60 días
              </label>
            </div>
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button
                className="btnGhost"
                onClick={() => setFiltrosDraft(EMPTY_FILTERS)}
              >
                Limpiar todo
              </button>
              <button
                className="btn"
                onClick={() => {
                  setFiltros(filtrosDraft);
                  setFiltroPanel(false);
                  setPage(1);
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modalOverlay" onClick={() => setImportOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div className="fichaName" style={{ fontSize: 17 }}>
                Importar colegios
              </div>
              <button
                className="modalX"
                onClick={() => setImportOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="hintSmall" style={{ marginBottom: 12 }}>
              Sube un CSV con las columnas <strong>nombre, código, ciudad, plan, límite de alumnos, correo del administrador</strong>. Los colegios entran en estado Prueba con los módulos base activos.
            </div>
            <input
              className="input"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0]?.name ?? null)}
            />
            {importFile && (
              <div className="hintSmall" style={{ marginTop: 8 }}>
                <strong>{importFile}</strong> seleccionado
              </div>
            )}
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button
                className="btnGhost"
                onClick={() => setImportOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn" onClick={applyImport}>
                Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {popup && (
        <div className="drawerOverlay" onClick={() => setPopup(null)}>
          <div
            className="drawerCard drawerCardCol"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawerHead">
              <span className="modoIco modoIcoOn">{SCHOOL_ICON}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fichaName" style={{ fontSize: 17 }}>
                  {popup.is_creating ? "Nuevo colegio" : popup.name}
                </div>
                <div className="fichaSub" style={{ margin: 0 }}>
                  {popup.is_creating
                    ? "Se crea en estado Prueba con los módulos base."
                    : `${popup.external_code} · ${popup.city} · plan ${PLAN_LABEL[popup.plan]}`}
                </div>
              </div>
              <button
                className="modalX"
                onClick={() => setPopup(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="drawerTabs">
              <button
                className={"drawerTab" + (popupTab === "datos" ? " drawerTabOn" : "")}
                onClick={() => setPopupTab("datos")}
              >
                Datos
              </button>
              <button
                className={"drawerTab" + (popupTab === "modulos" ? " drawerTabOn" : "")}
                onClick={() => setPopupTab("modulos")}
              >
                Módulos{" "}
                <span className="drawerTabNum">
                  {popup.modules.size}/{PLATFORM_MODULES.length}
                </span>
              </button>
            </div>

            <div className="drawerBody">
              {popupTab === "datos" ? (
                <div className="saDatosGrid">
                  <div className="saField saWide">
                    <label className="aulaLbl">Nombre del colegio</label>
                    <input
                      className="input"
                      value={popup.name}
                      onChange={(e) => setPopup({ ...popup, name: e.target.value })}
                      placeholder="I.E.P. …"
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">Estado del colegio</label>
                    <select
                      className="input"
                      value={popup.entity_status}
                      onChange={(e) =>
                        setPopup({
                          ...popup,
                          entity_status: e.target.value as SchoolStatus,
                        })
                      }
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Código
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      value={popup.external_code}
                      onChange={(e) =>
                        setPopup({ ...popup, external_code: e.target.value })
                      }
                      placeholder="ABC-000"
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Ciudad
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      value={popup.city}
                      onChange={(e) => setPopup({ ...popup, city: e.target.value })}
                      placeholder="Lima"
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Plan
                      <MockBadge />
                    </label>
                    <select
                      className="input"
                      value={popup.plan}
                      onChange={(e) =>
                        setPopup({
                          ...popup,
                          plan: e.target.value as SubscriptionPlan,
                        })
                      }
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {PLAN_LABEL[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Suscripción
                      <MockBadge />
                    </label>
                    <select
                      className="input"
                      value={popup.subscription_status}
                      onChange={(e) =>
                        setPopup({
                          ...popup,
                          subscription_status: e.target.value as SubscriptionStatus,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Límite de alumnos
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      type="number"
                      value={popup.student_limit}
                      onChange={(e) =>
                        setPopup({
                          ...popup,
                          student_limit: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Vence
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={popup.subscription_expires_at}
                      onChange={(e) =>
                        setPopup({
                          ...popup,
                          subscription_expires_at: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Administrador
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      value={popup.admin_full_name}
                      onChange={(e) =>
                        setPopup({ ...popup, admin_full_name: e.target.value })
                      }
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="saField">
                    <label className="aulaLbl">
                      Correo del administrador
                      <MockBadge />
                    </label>
                    <input
                      className="input"
                      value={popup.admin_email}
                      onChange={(e) =>
                        setPopup({ ...popup, admin_email: e.target.value })
                      }
                      placeholder="direccion@colegio.pe"
                    />
                  </div>
                  {!popup.is_creating && (
                    <div className="saField saWide">
                      <label className="aulaLbl">
                        Uso actual
                        <MockBadge />
                      </label>
                      <div className="hintSmall">
                        {popup.student_count} alumnos · {popup.teacher_count}{" "}
                        docentes · {popup.classroom_count} aulas registradas.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="saModList">
                  {PLATFORM_MODULES.map((m) => (
                    <div className="saModRow" key={m.module_key}>
                      <Switch
                        on={popup.modules.has(m.module_key)}
                        label={m.label}
                        onChange={() => toggleModule(m.module_key)}
                        disabled={popupSaving}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="saModName">
                          {m.label}
                          {m.is_core && (
                            <Chip tone="neutral">Núcleo</Chip>
                          )}
                        </div>
                        <div className="saModDesc">{m.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {popupError && (
              <div
                className="loginError"
                role="alert"
                style={{ margin: "0 16px" }}
              >
                {popupError}
              </div>
            )}

            <div className="drawerPie">
              <button
                className="btnGhost"
                onClick={() => setPopup(null)}
                disabled={popupSaving}
              >
                Cancelar
              </button>
              <button
                className="btn"
                onClick={saveSchool}
                disabled={popupSaving || !popup.name.trim()}
              >
                {popupSaving
                  ? "Guardando…"
                  : popup.is_creating
                    ? "Crear colegio"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
