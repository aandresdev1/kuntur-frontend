import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { MockBadge } from "@/components/MockBadge";
import { useSession } from "@/contexts/SessionContext";
import { ApiError } from "@/lib/api";
import {
  createUser,
  listUsers,
  updateUser,
  type ApiUser,
} from "@/lib/api/users";
import { listSchools } from "@/lib/api/schools";
import type { School, UserRole, UUID } from "@/types/domain";

type AdminRoleLabel = "Dirección" | "Soporte Kuntur";

const LABEL_TO_ROLE: Record<AdminRoleLabel, UserRole> = {
  Dirección: "school_admin",
  "Soporte Kuntur": "super_admin",
};

const ROLE_OPTIONS: AdminRoleLabel[] = ["Dirección", "Soporte Kuntur"];

function pickAdminRoleLabel(roles: UserRole[]): AdminRoleLabel {
  if (roles.includes("super_admin")) return "Soporte Kuntur";
  return "Dirección";
}

interface AdminPopupState {
  id_user: UUID | "";
  full_name: string;
  email: string;
  password: string;
  id_school: UUID | null;
  role_label: AdminRoleLabel;
  is_creating: boolean;
}

export default function PlatformAdminsPage() {
  const { session } = useSession();

  if (!session) return null;
  if (session.role !== "super_admin") return <Navigate to="/" replace />;

  const [rows, setRows] = useState<ApiUser[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [popup, setPopup] = useState<AdminPopupState | null>(null);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listUsers({ role: "super_admin" }),
      listUsers({ role: "school_admin" }),
      listSchools(),
    ])
      .then(([supers, dirs, schoolList]) => {
        if (cancelled) return;
        // dedupe by id_user in case a user has both roles
        const byId = new Map<string, ApiUser>();
        for (const u of [...supers, ...dirs]) byId.set(u.id_user, u);
        setRows(
          Array.from(byId.values()).sort((a, b) =>
            a.full_name.localeCompare(b.full_name, "es"),
          ),
        );
        setSchools(schoolList);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar la lista de administradores.",
        );
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openEdit = (u: ApiUser) => {
    setPopup({
      id_user: u.id_user,
      full_name: u.full_name,
      email: u.email,
      password: "",
      id_school: u.id_school,
      role_label: pickAdminRoleLabel(u.role_assignments.map((r) => r.role)),
      is_creating: false,
    });
    setPopupError("");
  };

  const openNew = () => {
    setPopup({
      id_user: "",
      full_name: "",
      email: "",
      password: "",
      id_school: schools[0]?.id_school ?? null,
      role_label: "Dirección",
      is_creating: true,
    });
    setPopupError("");
  };

  const save = async () => {
    if (!popup || popupSaving) return;
    const name = popup.full_name.trim();
    if (!name) {
      setPopupError("El nombre es requerido.");
      return;
    }

    const role = LABEL_TO_ROLE[popup.role_label];
    const id_school = role === "super_admin" ? null : popup.id_school;

    if (role === "school_admin" && !id_school) {
      setPopupError("Selecciona el colegio para la cuenta de Dirección.");
      return;
    }

    setPopupSaving(true);
    setPopupError("");
    try {
      if (popup.is_creating) {
        if (!popup.email.trim()) {
          throw new Error("El correo es requerido.");
        }
        if (popup.password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }
        const created = await createUser({
          full_name: name,
          email: popup.email.trim(),
          password: popup.password,
          roles: [role],
          id_school: role === "super_admin" ? undefined : id_school,
        });
        setRows((prev) =>
          [...prev, created].sort((a, b) =>
            a.full_name.localeCompare(b.full_name, "es"),
          ),
        );
      } else {
        const updated = await updateUser(
          popup.id_user as UUID,
          { full_name: name, roles: [role] },
          { id_school: popup.id_school },
        );
        setRows((prev) =>
          prev.map((r) => (r.id_user === updated.id_user ? updated : r)),
        );
      }
      setPopup(null);
    } catch (err) {
      setPopupError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo guardar la cuenta.",
      );
    } finally {
      setPopupSaving(false);
    }
  };

  if (loadStatus === "loading") {
    return (
      <div>
        <div className="pageTitle">Administradores.</div>
        <div className="pageSub">Cargando administradores…</div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div>
        <div className="pageTitle">Administradores.</div>
        <div className="loginError" role="alert" style={{ marginTop: 16 }}>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pageTitle">Administradores.</div>
      <div className="pageSub">
        {rows.length} cuentas con acceso de gestión · Dirección y equipo Kuntur
      </div>

      <div className="cuadHeader cuadHeaderTools">
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn" onClick={openNew}>
            + Nueva cuenta
          </button>
        </div>
      </div>

      <Card className="cardFlush">
        <div className="tableWrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Colegio</th>
                <th>Rol</th>
                <th>
                  Último acceso
                  <MockBadge />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const school = u.id_school
                  ? schools.find((s) => s.id_school === u.id_school)
                  : null;
                const roleLabel = pickAdminRoleLabel(
                  u.role_assignments.map((r) => r.role),
                );
                return (
                  <tr
                    key={u.id_user}
                    className="tblRowClick"
                    onClick={() => openEdit(u)}
                  >
                    <td>
                      <div className="tdName">
                        <Avatar full_name={u.full_name} size={28} />
                        <span>
                          {u.full_name}
                          <span
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "var(--ink-soft, #5A6784)",
                              fontWeight: 400,
                            }}
                          >
                            {u.email}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {school ? (
                        <span className="cellTag">{school.name}</span>
                      ) : (
                        <span className="cellTag cellTagWarn">
                          Toda la plataforma
                        </span>
                      )}
                    </td>
                    <td className="tdMuted">
                      <Chip
                        tone={roleLabel === "Soporte Kuntur" ? "amber" : "pen"}
                      >
                        {roleLabel}
                      </Chip>
                    </td>
                    <td className="tdMuted">—</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="histEmpty">
                      Aún no hay administradores registrados.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {popup && (
        <div className="drawerOverlay" onClick={() => setPopup(null)}>
          <div className="drawerCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div
                className="fichaName"
                style={{ fontSize: 17, paddingRight: 12 }}
              >
                {popup.is_creating ? "Nueva cuenta" : "Editar cuenta"}
              </div>
              <button
                className="modalX"
                onClick={() => setPopup(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="saField">
                <label className="aulaLbl">Nombre</label>
                <input
                  className="input"
                  value={popup.full_name}
                  onChange={(e) =>
                    setPopup({ ...popup, full_name: e.target.value })
                  }
                />
              </div>
              <div className="saField">
                <label className="aulaLbl">Correo</label>
                <input
                  className="input"
                  type="email"
                  value={popup.email}
                  disabled={!popup.is_creating}
                  onChange={(e) =>
                    setPopup({ ...popup, email: e.target.value })
                  }
                  placeholder="direccion@colegio.pe"
                />
                {!popup.is_creating && (
                  <div className="hintSmall">
                    El correo no puede modificarse desde esta vista.
                  </div>
                )}
              </div>
              {popup.is_creating && (
                <div className="saField">
                  <label className="aulaLbl">Contraseña inicial</label>
                  <input
                    className="input"
                    type="password"
                    value={popup.password}
                    onChange={(e) =>
                      setPopup({ ...popup, password: e.target.value })
                    }
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
              )}
              <div className="saField">
                <label className="aulaLbl">Rol</label>
                <select
                  className="input"
                  value={popup.role_label}
                  onChange={(e) =>
                    setPopup({
                      ...popup,
                      role_label: e.target.value as AdminRoleLabel,
                    })
                  }
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              {popup.role_label === "Dirección" && (
                <div className="saField">
                  <label className="aulaLbl">Colegio</label>
                  <select
                    className="input"
                    value={popup.id_school ?? ""}
                    onChange={(e) =>
                      setPopup({
                        ...popup,
                        id_school: e.target.value ? e.target.value : null,
                      })
                    }
                  >
                    <option value="">Selecciona un colegio…</option>
                    {schools.map((s) => (
                      <option key={s.id_school} value={s.id_school}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {popupError && (
              <div
                className="loginError"
                role="alert"
                style={{ marginTop: 12 }}
              >
                {popupError}
              </div>
            )}
            <div className="modalActions" style={{ marginTop: 16 }}>
              <button
                className="btnGhost"
                onClick={() => setPopup(null)}
                disabled={popupSaving}
              >
                Cancelar
              </button>
              <button className="btn" onClick={save} disabled={popupSaving}>
                {popupSaving
                  ? "Guardando…"
                  : popup.is_creating
                    ? "Crear cuenta"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
