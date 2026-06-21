import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "info" | "success" | "error";

interface ToastState {
  message: string;
  tone: ToastTone;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: "", tone: "info", visible: false });
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setToast({ message, tone, visible: true });
    timeoutRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  }, []);

  const toneClass =
    toast.tone === "error"
      ? "bg-danger"
      : toast.tone === "success"
        ? "bg-teal"
        : "bg-ink";

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className={`${toneClass} rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-card`}>
          {toast.message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return ctx;
}
