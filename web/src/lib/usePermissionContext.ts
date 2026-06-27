import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import type { FeaturePermissions, PermissionContext } from "./permissions";
import { getFeaturePermissions } from "./permissions";

export function usePermissionContext(): PermissionContext {
  const { session } = useAuth();
  const { state } = useData();
  return useMemo(
    () => ({
      user: session?.user ?? null,
      rolePermissions: state.rolePermissions ?? {},
      countryRolePermissions: state.countryRolePermissions ?? {},
      activeSchoolCode: session?.activeSchoolCode,
    }),
    [session?.user, session?.activeSchoolCode, state.rolePermissions, state.countryRolePermissions],
  );
}

/** Droits CRUD d'un module — chaque bouton UI doit s'aligner sur ces flags. */
export function useFeaturePermissions(feature: string): FeaturePermissions {
  const ctx = usePermissionContext();
  return useMemo(() => getFeaturePermissions(ctx, feature), [ctx, feature]);
}
