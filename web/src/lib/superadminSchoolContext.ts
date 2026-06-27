import type { Session, SessionUser } from "../types";
import { isInternalSchoolRole } from "./format";
import { isSuperAdminRole } from "./orgHierarchy";

/** Code établissement actif pour le pilotage opérationnel (interne ou Superadmin). */
export function getActiveSchoolCode(session: Session | null): string | undefined {
  if (!session?.user) return undefined;

  if (isInternalSchoolRole(session.user.role)) {
    const code = session.user.schoolCode?.trim();
    return code && code !== "*" ? code : undefined;
  }

  if (isSuperAdminRole(session.user.role)) {
    return session.activeSchoolCode?.trim() || undefined;
  }

  const code = session.user.schoolCode?.trim();
  return code && code !== "*" ? code : undefined;
}

/** Accès aux écrans établissement (pilotage, configuration, modules scolaires). */
export function canAccessSchoolOperationalViews(session: Session | null): boolean {
  if (!session?.user) return false;
  if (isInternalSchoolRole(session.user.role)) return true;
  return isSuperAdminRole(session.user.role) && Boolean(getActiveSchoolCode(session));
}

/** Utilisateur avec le périmètre établissement appliqué (filtrage des données). */
export function resolveScopedUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  const schoolCode = getActiveSchoolCode(session);
  if (!schoolCode || session.user.schoolCode === schoolCode) return session.user;
  return { ...session.user, schoolCode };
}
