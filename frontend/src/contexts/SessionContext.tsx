import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@/types/domain";
import {
  clearTokens,
  fetchMe,
  loadTokens,
  loginRequest,
  saveTokens,
  toSession,
} from "@/lib/auth";
import { ApiError } from "@/lib/api";

interface SessionContextValue {
  session: Session | null;
  status: "loading" | "ready";
  signIn: (email: string, password: string) => Promise<void>;
  signInMock: (session: Session) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    const tokens = loadTokens();
    if (!tokens?.access_token) {
      setStatus("ready");
      return;
    }
    fetchMe()
      .then((user) => {
        if (!cancelled) setSession(toSession(user));
      })
      .catch(() => {
        if (!cancelled) {
          clearTokens();
          setSession(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await loginRequest(email, password);
    saveTokens(tokens);
    try {
      const user = await fetchMe();
      setSession(toSession(user));
    } catch (err) {
      clearTokens();
      throw err instanceof ApiError
        ? err
        : new Error("No se pudo cargar el perfil.");
    }
  }, []);

  const signInMock = useCallback((next: Session) => {
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, status, signIn, signInMock, signOut }),
    [session, status, signIn, signInMock, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
