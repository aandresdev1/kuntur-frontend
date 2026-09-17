import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Avatar } from "@/components/Avatar";
import { Chip, type ChipTone } from "@/components/Chip";
import {
  authenticate,
  DEMO_ACCOUNTS,
} from "@/data/demoAccounts";
import type { UserRole } from "@/types/domain";

const ROLE_CHIP_TONE: Record<UserRole, ChipTone> = {
  school_admin: "green",
  teacher: "pen",
  guardian: "amber",
  super_admin: "amber",
};

const ROLE_CHIP_LABEL: Record<UserRole, string> = {
  school_admin: "Dirección",
  teacher: "Docente",
  guardian: "Familia",
  super_admin: "Superadmin",
};

interface LocationState {
  from?: { pathname: string };
}

export default function MockLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInMock } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const session = authenticate(email, password);
    if (!session) {
      setError(
        email.trim() || password
          ? "Correo o contraseña incorrectos. Usa una de las cuentas de prueba."
          : "Ingresa tu correo y contraseña.",
      );
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      signInMock(session);
      navigate(redirectTo, { replace: true });
    }, 650);
  };

  const useAccount = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      const session = authenticate(accountEmail, accountPassword);
      if (session) {
        signInMock(session);
        navigate(redirectTo, { replace: true });
      }
    }, 650);
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="loginBrand">
          <span className="loginLogo">Kuntur</span>
          <span className="loginTagline">
            seguimiento del alumno · inicial &amp; primaria
          </span>
        </div>

        <h1 className="loginTitle">Ingresa a tu cuenta</h1>
        <p className="loginSub">
          Un solo acceso para todo el nido. Verás la vista que corresponde a tu
          rol.
        </p>

        <form className="loginForm" onSubmit={submit}>
          <label className="loginLabel" htmlFor="lg-email">
            Correo
          </label>
          <input
            id="lg-email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="tucorreo@colegio.pe"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          <label className="loginLabel" htmlFor="lg-pass">
            Contraseña
          </label>
          <input
            id="lg-pass"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          {error && (
            <div className="loginError" role="alert">
              {error}
            </div>
          )}

          <button className="btn loginBtn" type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
          <button type="button" className="loginLink">
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <div className="loginDiv">
          <span>cuentas de prueba</span>
        </div>

        <div className="loginCuentas">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              className="loginCuenta"
              onClick={() => useAccount(account.email, account.password)}
            >
              <Avatar full_name={account.full_name} size={34} />
              <span className="loginCuentaTxt">
                <strong>{account.full_name}</strong>
                <span>{account.role_label}</span>
              </span>
              <Chip tone={ROLE_CHIP_TONE[account.role]}>
                {ROLE_CHIP_LABEL[account.role]}
              </Chip>
            </button>
          ))}
        </div>

        <p className="loginNota">
          Demo con datos ficticios · contraseña: demo1234
        </p>
      </div>
    </div>
  );
}
