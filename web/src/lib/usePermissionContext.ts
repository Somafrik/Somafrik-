import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import type { PermissionContext } from "./permissions";

export function usePermissionContext(): PermissionContext {
  const { session } = useAuth();
  const { state } = useData();
  return useMemo(
    () => ({
      user: session?.user ?? null,
      rolePermissions: state.rolePermissions ?? {},
    }),
    [session?.user, state.rolePermissions],
  );
}
