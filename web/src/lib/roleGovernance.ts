import { CRUD_ACTIONS, CRUD_PERMISSION_MODULES } from "./constants";
import type { UserAccount } from "../types";
import {
  COUNTRY_ADMIN_ROLE,
  isPlatformBackOfficeRole,
  isSuperadminManagedRole,
  SCHOOL_ADMIN_ROLE,
  SUPERADMIN_MANAGED_ROLES,
  SUPER_ADMIN_ROLE,
} from "./orgHierarchy";

export { COUNTRY_ADMIN_ROLE, SCHOOL_ADMIN_ROLE } from "./orgHierarchy";

/**
 * Règles métier Somafrik — gouvernance des rôles vs niveaux hiérarchiques.
 *
 * Niveaux : Pays → Local (établissement).
 * Rôles plateforme : Admin Pays, Admin School (matrice Superadmin).
 */
export const ROLE_GOVERNANCE_NOTES = {
  superadminMatrix: `Le Super Administrateur dispose de ALL_PRIVILEGES. Configurez ${COUNTRY_ADMIN_ROLE} par pays (politique interne) et ${SCHOOL_ADMIN_ROLE} au niveau établissement.`,
  localOperational: "Les rôles métier d'établissement (Secrétaire, Préfet, Enseignant…) se pilotent dans Configuration.",
  countryPolicy: "Pour Admin Pays : sélectionnez un pays, puis accordez les modules pédagogiques et opérationnels selon la politique de ce pays.",
} as const;

/** Modules pilotés au niveau pays (droits Admin Pays — socle global). */
export const COUNTRY_SCOPE_MODULES = new Set(["Pays", "Établissements", "Abonnements", "Utilisateurs"]);

export type CountryRolePermissions = Record<string, Partial<Record<string, string[]>>>;

export function resolveSuperadminPermissionRole(module: string): typeof COUNTRY_ADMIN_ROLE | typeof SCHOOL_ADMIN_ROLE {
  return COUNTRY_SCOPE_MODULES.has(module) ? COUNTRY_ADMIN_ROLE : SCHOOL_ADMIN_ROLE;
}

/** Modules CRUD affichés dans la matrice Superadmin selon le rôle cible. */
export function getSuperadminMatrixModules(role: string, countryCode?: string): string[] {
  if (role === COUNTRY_ADMIN_ROLE) {
    if (countryCode?.trim()) {
      return [...CRUD_PERMISSION_MODULES];
    }
    return CRUD_PERMISSION_MODULES.filter((module) => COUNTRY_SCOPE_MODULES.has(module));
  }
  if (role === SCHOOL_ADMIN_ROLE) {
    return CRUD_PERMISSION_MODULES.filter((module) => !COUNTRY_SCOPE_MODULES.has(module));
  }
  return [...CRUD_PERMISSION_MODULES];
}

/** Modules disponibles pour un rôle cible dans le parcours Superadmin. */
export function getSuperadminPathModulesForRole(role: string, countryCode?: string): string[] {
  return getSuperadminMatrixModules(role, countryCode);
}

/** Liste des modules fonctionnels accessibles après sélection pays + établissement. */
export function getSuperadminPathModules(): string[] {
  const modules = new Set([
    ...getSuperadminMatrixModules(COUNTRY_ADMIN_ROLE),
    ...getSuperadminMatrixModules(SCHOOL_ADMIN_ROLE),
  ]);
  return CRUD_PERMISSION_MODULES.filter((module) => modules.has(module));
}

export function isModuleEnabledInDraft(draft: Set<string>, module: string): boolean {
  return CRUD_ACTIONS.some((action) => draft.has(`${module}:${action.key}`));
}

export function isModuleFullyEnabledInDraft(draft: Set<string>, module: string): boolean {
  return CRUD_ACTIONS.every((action) => draft.has(`${module}:${action.key}`));
}

export function setModuleEnabledInDraft(draft: Set<string>, module: string, enabled: boolean): Set<string> {
  const next = new Set(draft);
  for (const action of CRUD_ACTIONS) {
    next.delete(`${module}:${action.key}`);
  }
  if (enabled) {
    for (const action of CRUD_ACTIONS) {
      next.add(`${module}:${action.key}`);
    }
  }
  return next;
}

/** Droits Admin Pays effectifs : politique pays si définie, sinon socle global. */
export function resolveCountryAdminPermissions(
  countryCode: string | undefined,
  rolePermissions: Record<string, string[]>,
  countryRolePermissions: CountryRolePermissions = {},
): string[] {
  const global = rolePermissions[COUNTRY_ADMIN_ROLE] ?? [];
  const code = String(countryCode ?? "").trim();
  if (!code) {
    return normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, global);
  }
  const countrySpecific = countryRolePermissions[code]?.[COUNTRY_ADMIN_ROLE];
  if (!Array.isArray(countrySpecific) || !countrySpecific.length) {
    return normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, global);
  }
  return normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, countrySpecific);
}

export function syncCountryAdminUsersWithPermissions(
  users: UserAccount[],
  countryCode: string,
  permissions: string[],
): UserAccount[] {
  const normalized = normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, permissions);
  const target = countryCode.trim().toUpperCase();
  return users.map((user) => {
    if (user.role !== COUNTRY_ADMIN_ROLE) return user;
    const userCountry = String(user.countryCode ?? "").trim().toUpperCase();
    if (!userCountry || userCountry !== target) return user;
    return { ...user, permissions: normalized };
  });
}

export function syncPlatformUsersWithRolePermissions(
  users: UserAccount[],
  rolePermissions: Record<string, string[]>,
): UserAccount[] {
  return users.map((user) => {
    if (!SUPERADMIN_MANAGED_ROLES.includes(user.role as (typeof SUPERADMIN_MANAGED_ROLES)[number])) {
      return user;
    }
    const configured = rolePermissions[user.role];
    if (!Array.isArray(configured)) return user;
    return {
      ...user,
      permissions: normalizeManagedRolePermissions(user.role, configured),
    };
  });
}

/** Normalise les droits éditables par le Superadmin (format Module:ACTION). */
export function normalizeManagedRolePermissions(role: string, permissions: Iterable<string>): string[] {
  if (!SUPERADMIN_MANAGED_ROLES.includes(role as (typeof SUPERADMIN_MANAGED_ROLES)[number])) {
    return [...new Set(permissions)].sort();
  }

  const normalized = new Set<string>();
  for (const permission of permissions) {
    if (!permission || permission === "ALL_PRIVILEGES") continue;
    if (permission === "COUNTRY_PRIVILEGES" && role === COUNTRY_ADMIN_ROLE) {
      normalized.add(permission);
      continue;
    }
    if (/^[^:]+:[A-Z]+$/.test(permission)) {
      normalized.add(permission);
    }
  }
  return [...normalized].sort();
}

/** Rôle métier local établissement (pilotage Configuration), hors comptes plateforme. */
export function isEstablishmentOperationalRole(role?: string): boolean {
  if (!role || role === SUPER_ADMIN_ROLE) return false;
  if (isSuperadminManagedRole(role)) return false;
  return !isPlatformBackOfficeRole(role);
}
