import React, { createContext, useContext, useMemo, useState } from "react";
import { LoginResponse } from "../services/api";

type AuthContextValue = {
  session: LoginResponse | null;
  setSession: (session: LoginResponse | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);

  const value = useMemo(
    () => ({
      session,
      setSession,
      logout: () => setSession(null),
    }),
    [session]
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
