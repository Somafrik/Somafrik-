import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, setAccessTokenProvider } from "../api/client";
import { normalizePlatformRole, isSuperAdminRole } from "../lib/orgHierarchy";
import type { LoginProfile, Session } from "../types";

interface LoginInput {
  identifier: string;
  password: string;
  schoolCode?: string;
  profile: LoginProfile;
}

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<Session>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
  setSession: (session: Session | null) => void;
  /** Superadmin : sélectionne l'établissement pour piloter les modules scolaires. */
  setActiveSchool: (schoolCode: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "somafrik.web.session";

function loadStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(loadStoredSession);
  const sessionRef = useRef<Session | null>(session);

  const setSession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSessionState(next);
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible: on continue en mémoire */
    }
  }, []);

  useEffect(() => {
    setAccessTokenProvider(() => sessionRef.current?.accessToken ?? null);
  }, []);

  const login = useCallback(
    async ({ identifier, password, schoolCode, profile }: LoginInput) => {
      if (profile === "school" && !schoolCode) {
        throw new Error("Le code établissement est obligatoire pour un compte établissement.");
      }
      const payload = {
        identifier: identifier.trim(),
        password: password.trim(),
        ...(schoolCode ? { schoolCode: schoolCode.trim().toUpperCase() } : {}),
      };
      const response = await api.post<Session>("/backoffice/login", payload);
      const normalized: Session = {
        ...response,
        user: response.user
          ? { ...response.user, role: normalizePlatformRole(response.user.role) }
          : response.user,
      };
      setSession(normalized);
      return normalized;
    },
    [setSession],
  );

  const changePassword = useCallback(
    async (newPassword: string) => {
      const response = await api.post<{ user: Session["user"] }>("/auth/change-password", {
        newPassword: newPassword.trim(),
      });
      const current = sessionRef.current;
      if (current) {
        setSession({
          ...current,
          user: { ...current.user, ...response.user, mustChangePassword: false },
        });
      }
    },
    [setSession],
  );

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const setActiveSchool = useCallback(
    (schoolCode: string | null) => {
      const current = sessionRef.current;
      if (!current?.user || !isSuperAdminRole(current.user.role)) return;
      const code = schoolCode?.trim().toUpperCase() || undefined;
      setSession({
        ...current,
        activeSchoolCode: code,
        user: {
          ...current.user,
          schoolCode: code,
        },
      });
    },
    [setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      logout,
      changePassword,
      setSession,
      setActiveSchool,
    }),
    [session, login, logout, changePassword, setSession, setActiveSchool],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
