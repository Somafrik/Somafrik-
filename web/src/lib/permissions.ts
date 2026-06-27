import type { SessionUser } from "../types";
import { CRUD_ACTIONS, CRUD_PERMISSION_MODULES, VIEW_PERMISSION_FEATURES } from "./constants";
import { getInternalRoleDefaults } from "./internalRoleDefaults";
import { isInternalSchoolRole, normalize, isSchoolAdminRole } from "./format";
import { canSchoolAdminMutateTeachers } from "./pedagogyGovernance";
import {
  isSuperAdminRole,
  LEGACY_SUPER_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  SUPERADMIN_MANAGED_ROLES,
} from "./orgHierarchy";
import {
  isEstablishmentOperationalRole,
  COUNTRY_ADMIN_ROLE,
  COUNTRY_SCOPE_MODULES,
  getSuperadminMatrixModules,
  normalizeManagedRolePermissions,
  resolveCountryAdminPermissions,
  type CountryRolePermissions,
} from "./roleGovernance";

const SCHOOL_ADMIN_FORBIDDEN_FEATURES = new Set(["Établissements", "Abonnements"]);

function superadminHasSchoolContext(ctx: PermissionContext): boolean {
  return Boolean(ctx.activeSchoolCode?.trim());
}

export interface PermissionContext {
  user: SessionUser | null;
  rolePermissions: Record<string, string[]>;
  countryRolePermissions?: CountryRolePermissions;
  /** Établissement actif (Superadmin en mode pilotage). */
  activeSchoolCode?: string;
}

export interface FeaturePermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canSuspend: boolean;
}

/** Union des droits du compte, de la matrice Super Admin et de la politique pays. */
export function resolveEffectivePermissions(
  role: string | undefined,
  userPermissions: string[] | undefined,
  rolePermissions: Record<string, string[]>,
  options?: {
    countryCode?: string;
    countryRolePermissions?: CountryRolePermissions;
  },
): string[] {
  if (role === COUNTRY_ADMIN_ROLE) {
    const fromCountryPolicy = resolveCountryAdminPermissions(
      options?.countryCode ?? undefined,
      rolePermissions,
      options?.countryRolePermissions ?? {},
    );
    const fromUser = userPermissions ?? [];
    return [...new Set([...fromUser, ...fromCountryPolicy])];
  }

  const fromRole = role && Array.isArray(rolePermissions[role]) ? rolePermissions[role] : [];

  if (
    role &&
    SUPERADMIN_MANAGED_ROLES.includes(role as (typeof SUPERADMIN_MANAGED_ROLES)[number]) &&
    Array.isArray(rolePermissions[role])
  ) {
    return normalizeManagedRolePermissions(role, fromRole);
  }

  const fromUser = userPermissions ?? [];
  const fromDefaults = getInternalRoleDefaults(role);
  return [...new Set([...fromUser, ...fromRole, ...fromDefaults])];
}

function resolveUserCountryCode(user: SessionUser | null | undefined): string | undefined {
  if (!user) return undefined;
  return String(user.countryCode ?? user.countryScope ?? "").trim() || undefined;
}

export function getCurrentRolePermissions(ctx: PermissionContext): string[] {
  return resolveEffectivePermissions(ctx.user?.role, ctx.user?.permissions, ctx.rolePermissions, {
    countryCode: resolveUserCountryCode(ctx.user),
    countryRolePermissions: ctx.countryRolePermissions,
  });
}

const COUNTRY_PRIVILEGE_FEATURES = new Set(["pays", "etablissements", "abonnements", "utilisateurs", "rapports"]);

function countryPrivilegeAllowsRead(normalizedFeature: string): boolean {
  return COUNTRY_PRIVILEGE_FEATURES.has(normalizedFeature);
}

export function legacyPermissionGrantsFeatureAction(
  permission: string,
  feature: string,
  action: string,
): boolean {
  return permissionMatchesFeature(normalize(permission), normalize(feature), action);
}

/** Convertit droits stockés (legacy + granulaires) en cases CRUD pour l'édition Superadmin. */
export function expandStoredPermissionsToGranular(
  role: string,
  permissions: string[] = [],
  options?: { countryCode?: string },
): Set<string> {
  const modules = getSuperadminMatrixModules(role, options?.countryCode);
  const granular = new Set<string>();
  const permSet = new Set(permissions);

  if (permSet.has("ALL_PRIVILEGES")) {
    for (const module of modules) {
      for (const action of CRUD_ACTIONS) {
        granular.add(`${module}:${action.key}`);
      }
    }
    return granular;
  }

  for (const permission of permissions) {
    if (/^[^:]+:[A-Z]+$/.test(permission)) {
      const [module] = permission.split(":");
      if (modules.includes(module)) granular.add(permission);
    }
  }

  for (const module of modules) {
    for (const action of CRUD_ACTIONS) {
      const key = `${module}:${action.key}`;
      if (granular.has(key)) continue;
      if ([...permSet].some((permission) => legacyPermissionGrantsFeatureAction(permission, module, action.key))) {
        granular.add(key);
      }
    }
  }

  return granular;
}

function permissionMatchesFeature(
  normalizedPermission: string,
  normalizedFeature: string,
  action: string,
): boolean {
  if (normalizedPermission === "country-privileges") {
    return action === "READ" && countryPrivilegeAllowsRead(normalizedFeature);
  }
  if (normalizedPermission === "all-privileges") {
    return true;
  }
  if (!normalizedPermission.includes(normalizedFeature)) {
    return false;
  }
  if (action === "READ") {
    return (
      normalizedPermission.includes("voir") ||
      normalizedPermission.includes("lire") ||
      normalizedPermission.includes("gerer") ||
      normalizedPermission.includes("auditer") ||
      normalizedPermission.includes("suivre") ||
      normalizedPermission.includes("controler") ||
      normalizedPermission.includes("controle") ||
      normalizedPermission.includes("valider") ||
      normalizedPermission.includes("publier") ||
      normalizedPermission.includes("faire") ||
      normalizedPermission.includes("organiser") ||
      normalizedPermission.includes("creer") ||
      normalizedPermission.includes("ajouter") ||
      normalizedPermission.includes("modifier") ||
      normalizedPermission.includes("messages") ||
      normalizedPermission.includes("annonces") ||
      normalizedPermission.includes("communications")
    );
  }
  return (
    normalizedPermission.includes(normalize(action)) ||
    normalizedPermission.includes("gerer") ||
    normalizedPermission.includes("crud") ||
    (action === "CREATE" && normalizedPermission.includes("ajouter"))
  );
}

function hasGranularPermission(permissions: Set<string>, feature: string, action: string): boolean {
  if (permissions.has(`${feature}:${action}`)) return true;
  if (permissions.has(`${feature}:CRUD`)) return true;
  if (action === "READ" && (permissions.has(`${feature}:READ`) || permissions.has(`${feature}:R`))) {
    return true;
  }
  return false;
}

function hasLegacyPermission(permissions: Set<string>, feature: string, action: string): boolean {
  const normalizedFeature = normalize(feature);
  return [...permissions].some((permission) =>
    permissionMatchesFeature(normalize(permission), normalizedFeature, action),
  );
}

function hasPrivilegeBundlePermission(
  permissions: Set<string>,
  feature: string,
  action: string,
): boolean {
  if (permissions.has("ALL_PRIVILEGES")) return true;
  if (permissions.has("COUNTRY_PRIVILEGES") && action === "READ") {
    return countryPrivilegeAllowsRead(normalize(feature));
  }
  return false;
}

function hasPermissionForFeature(
  ctx: PermissionContext,
  feature: string,
  action: string,
): boolean {
  const permissions = new Set(getCurrentRolePermissions(ctx));

  if (hasGranularPermission(permissions, feature, action)) return true;
  if (hasLegacyPermission(permissions, feature, action)) return true;
  if (hasPrivilegeBundlePermission(permissions, feature, action)) return true;
  return false;
}

export function canManageRolePermissions(ctx: PermissionContext): boolean {
  if (isSuperAdminRole(ctx.user?.role)) return true;
  return getCurrentRolePermissions(ctx).includes("ALL_PRIVILEGES");
}

export function getFeaturePermissions(ctx: PermissionContext, feature: string): FeaturePermissions {
  return {
    canRead: hasBackOfficePermission(ctx, feature, "READ"),
    canCreate: hasBackOfficePermission(ctx, feature, "CREATE"),
    canUpdate: hasBackOfficePermission(ctx, feature, "UPDATE"),
    canDelete: hasBackOfficePermission(ctx, feature, "DELETE"),
    canSuspend: hasBackOfficePermission(ctx, feature, "SUSPEND"),
  };
}

export function hasBackOfficePermission(
  ctx: PermissionContext,
  features: string | (string | null)[] | null,
  action: string = "READ",
): boolean {
  if (!ctx.user) return false;
  const normalizedAction = action === "R" ? "READ" : action;
  const featureList = Array.isArray(features) ? features : [features];

  if (
    isSchoolAdminRole(ctx.user.role) &&
    featureList.some((feature) => feature === "Enseignants") &&
    !canSchoolAdminMutateTeachers(normalizedAction)
  ) {
    return false;
  }

  if (isSuperAdminRole(ctx.user.role)) {
    return true;
  }

  if (
    isInternalSchoolRole(ctx.user.role) &&
    featureList.some((feature) => feature && SCHOOL_ADMIN_FORBIDDEN_FEATURES.has(feature))
  ) {
    return false;
  }

  if (featureList.includes("Droits par rôle")) return canManageRolePermissions(ctx);

  return featureList.some((feature) => {
    if (!feature) return true;
    return hasPermissionForFeature(ctx, feature, normalizedAction);
  });
}

export function canReadView(ctx: PermissionContext, viewName: string): boolean {
  if (viewName === "overview") return true;
  if (viewName === "establishment") {
    return isInternalSchoolRole(ctx.user?.role) || (isSuperAdminRole(ctx.user?.role) && superadminHasSchoolContext(ctx));
  }
  if (viewName === "configuration") {
    const canAccess =
      isInternalSchoolRole(ctx.user?.role) ||
      (isSuperAdminRole(ctx.user?.role) && superadminHasSchoolContext(ctx));
    if (!canAccess) return false;
    if (isSuperAdminRole(ctx.user?.role)) return true;
    return (
      hasBackOfficePermission(ctx, "Paramètres Établissement", "READ") ||
      isSchoolAdminRole(ctx.user?.role) ||
      hasBackOfficePermission(ctx, "Élèves", "READ") ||
      hasBackOfficePermission(ctx, "Enseignants", "READ") ||
      hasBackOfficePermission(ctx, "Utilisateurs", "READ")
    );
  }
  return hasBackOfficePermission(ctx, VIEW_PERMISSION_FEATURES[viewName] ?? null, "READ");
}

export function hasSchoolPilotageAccess(ctx: PermissionContext): boolean {
  if (isSuperAdminRole(ctx.user?.role) && superadminHasSchoolContext(ctx)) {
    return true;
  }
  const schoolFeatures = [
    "Utilisateurs",
    "Classes",
    "Élèves",
    "Enseignants",
    "Affectations",
    "Présences",
    "Notes",
    "Bulletins",
    "Paiements",
    "Messages",
    "Documents",
    "Rapports",
  ];
  return (
    isInternalSchoolRole(ctx.user?.role) &&
    schoolFeatures.some((feature) => hasBackOfficePermission(ctx, feature, "READ"))
  );
}

export function getSuperadminManagedRoles(): string[] {
  return [...SUPERADMIN_MANAGED_ROLES];
}

export function getPermissionRoles(_ctx?: PermissionContext): string[] {
  return getSuperadminManagedRoles();
}

export function mergeSuperadminRolePermissions(
  current: Record<string, string[]>,
  requested: Record<string, string[]>,
): Record<string, string[]> {
  const next = { ...current };
  for (const role of SUPERADMIN_MANAGED_ROLES) {
    if (Array.isArray(requested[role])) {
      next[role] = normalizeManagedRolePermissions(role, requested[role]);
    }
  }
  return ensureSuperAdminRolePermissions(next);
}

/** Le Super Admin conserve toujours ALL_PRIVILEGES dans la matrice système. */
export function ensureSuperAdminRolePermissions(
  rolePermissions: Record<string, string[]>,
): Record<string, string[]> {
  const merged = new Set([
    ...(rolePermissions[SUPER_ADMIN_ROLE] ?? []),
    ...(rolePermissions[LEGACY_SUPER_ADMIN_ROLE] ?? []),
    "ALL_PRIVILEGES",
  ]);
  return {
    ...rolePermissions,
    [SUPER_ADMIN_ROLE]: [...merged].sort((left, right) => left.localeCompare(right, "fr")),
  };
}

export function isLocalManagedRole(role?: string): boolean {
  return isEstablishmentOperationalRole(role);
}
