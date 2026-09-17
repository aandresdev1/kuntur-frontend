import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 2600;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next_id = useRef(0);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++next_id.current;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, DEFAULT_DURATION_MS);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastLayer toasts={toasts} />
    </ToastContext.Provider>
  );
}

interface ToastLayerProps {
  toasts: Toast[];
}

function ToastLayer({ toasts }: ToastLayerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toastStack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toastPill toastPill--${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const NOOP_TOAST: ToastContextValue = { showToast: () => {} };

export function useToast(): ToastContextValue {
  // Fallback silencioso: si el provider no está montado (tests, storybook),
  // no rompe — solo pierde el feedback visual.
  return useContext(ToastContext) ?? NOOP_TOAST;
}
