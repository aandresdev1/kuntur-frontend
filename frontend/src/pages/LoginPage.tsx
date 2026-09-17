import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { ApiError } from "@/lib/api";

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signIn(trimmedEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(resolveErrorMessage(err));
      setLoading(false);
    }
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
            disabled={loading}
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
            disabled={loading}
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
      </div>
    </div>
  );
}

function resolveErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Correo o contraseña incorrectos.";
    if (err.status === 400) return err.message || "Datos inválidos.";
    if (err.status >= 500) {
      return "El servidor no está disponible. Intenta nuevamente.";
    }
    return err.message || "No se pudo iniciar sesión.";
  }
  if (err instanceof TypeError) {
    return "No se pudo conectar con el servidor. Revisa tu conexión.";
  }
  return "No se pudo iniciar sesión.";
}
