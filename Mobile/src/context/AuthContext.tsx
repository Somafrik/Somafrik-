import React, { createContext, useContext, useMemo, useState } from "react";
import { LoginResponse, logout as logoutSession } from "../services/api";
import { enrichSessionPermissions } from "../domain/security/permissions";

type AuthContextValue = {
  session: LoginResponse | null;
  selectedStudentId: string | null;
  setSession: (session: LoginResponse | null) => void;
  setSelectedStudentId: (studentId: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const saveSession = (nextSession: LoginResponse | null) => {
    const enriched = enrichSessionPermissions(nextSession);
    setSession(enriched);
    setSelectedStudentId(enriched?.user.children?.[0]?.id ?? enriched?.user.id ?? null);
  };

  const value = useMemo(
    () => ({
      session,
      selectedStudentId,
      setSession: saveSession,
      setSelectedStudentId,
      logout: () => {
        logoutSession().catch(() => undefined);
        saveSession(null);
      },
    }),
    [session, selectedStudentId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider");
  }

  return context;
}
