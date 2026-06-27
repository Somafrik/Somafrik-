/**
 * Règles métier RBAC Somafrik — source unique côté backend (MVP POO).
 * Alignée sur web/src/lib/roleGovernance.ts
 */

const COUNTRY_ADMIN_ROLE = "Admin Pays";
const SCHOOL_ADMIN_ROLE = "Admin School";
const SUPER_ADMIN_ROLES = new Set(["Super Administrateur Somafrik", "Super Administrateur OKAFRIK"]);

const SUPERADMIN_MANAGED_ROLES = [COUNTRY_ADMIN_ROLE, SCHOOL_ADMIN_ROLE];

/** Modules pilotés au niveau pays (Admin Pays). */
const COUNTRY_SCOPE_MODULES = new Set(["Pays", "Établissements", "Abonnements", "Utilisateurs"]);

const CRUD_ACTIONS = ["READ", "CREATE", "UPDATE", "DELETE", "SUSPEND"];

class RoleGovernanceService {
  get countryScopeModules() {
    return COUNTRY_SCOPE_MODULES;
  }

  get superadminManagedRoles() {
    return SUPERADMIN_MANAGED_ROLES;
  }

  isSuperAdminRole(role) {
    return SUPER_ADMIN_ROLES.has(role ?? "");
  }

  isCountryScopeModule(module) {
    return COUNTRY_SCOPE_MODULES.has(module);
  }

  resolvePermissionRole(module) {
    return this.isCountryScopeModule(module) ? COUNTRY_ADMIN_ROLE : SCHOOL_ADMIN_ROLE;
  }

  matrixModulesForRole(role, countryCode) {
    const modules = [
      "Pays",
      "Établissements",
      "Abonnements",
      "Utilisateurs",
      "Classes",
      "Élèves",
      "Enseignants",
      "Affectations",
      "Présences",
      "Notes",
      "Bulletins",
      "Paiements",
      "Notifications",
      "Messages",
      "Documents",
      "Rapports",
      "Paramètres Établissement",
      "Années Académiques",
      "Matières",
      "Examens",
    ];

    if (role === COUNTRY_ADMIN_ROLE) {
      if (countryCode) return modules;
      return modules.filter((module) => COUNTRY_SCOPE_MODULES.has(module));
    }
    if (role === SCHOOL_ADMIN_ROLE) {
      return modules.filter((module) => !COUNTRY_SCOPE_MODULES.has(module));
    }
    return modules;
  }

  resolveCountryAdminPermissions(countryCode, rolePermissions = {}, countryRolePermissions = {}) {
    const global = rolePermissions[COUNTRY_ADMIN_ROLE] ?? [];
    const code = String(countryCode ?? "").trim();
    if (!code) {
      return this.normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, global);
    }
    const countrySpecific = countryRolePermissions?.[code]?.[COUNTRY_ADMIN_ROLE];
    if (!Array.isArray(countrySpecific) || !countrySpecific.length) {
      return this.normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, global);
    }
    return this.normalizeManagedRolePermissions(COUNTRY_ADMIN_ROLE, countrySpecific);
  }

  /** Entités backoffice modifiables par Admin Pays (pas la scolarité opérationnelle). */
  editableEntitiesForCountryAdmin() {
    return ["schools", "users", "countries", "subscriptions"];
  }

  normalizeManagedRolePermissions(role, permissions = []) {
    if (!SUPERADMIN_MANAGED_ROLES.includes(role)) {
      return [...new Set(permissions)].sort((left, right) => String(left).localeCompare(String(right), "fr"));
    }

    const normalized = new Set();
    for (const permission of permissions) {
      if (!permission) continue;
      if (permission === "ALL_PRIVILEGES") continue;
      if (permission === "COUNTRY_PRIVILEGES" && role === COUNTRY_ADMIN_ROLE) {
        normalized.add(permission);
        continue;
      }
      if (/^[^:]+:[A-Z]+$/.test(String(permission))) {
        normalized.add(String(permission));
      }
    }
    return [...normalized].sort((left, right) => String(left).localeCompare(String(right), "fr"));
  }

  permissionsFromMatrix(securityMatrix, role) {
    const matrixRole = role === "Proviseur" || role === "Directeur" ? "Préfet des études" : role;
    return Object.entries(securityMatrix).flatMap(([feature, grants]) => {
      const access = grants[matrixRole] ?? "-";
      if (access === "-") return [];
      const actions = access === "CRUD" ? CRUD_ACTIONS : ["READ"];
      return actions.map((action) => `${feature}:${action}`);
    });
  }

  isSchoolRolePermissionAllowed(permission) {
    if (!permission || permission === "ALL_PRIVILEGES" || permission === "COUNTRY_PRIVILEGES") {
      return false;
    }

    const [feature] = String(permission).split(":");
    const normalizedFeature = this.normalizeToken(feature);
    if (["pays", "etablissements", "abonnements"].includes(normalizedFeature)) {
      return false;
    }

    const normalizedPermission = this.normalizeToken(permission);
    return !["abonnement", "inscription", "tarif"].some((keyword) => normalizedPermission.includes(keyword));
  }

  normalizeToken(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  /** Le Super Admin conserve toujours ALL_PRIVILEGES (configuration système). */
  ensureSuperAdminRolePermissions(rolePermissions = {}) {
    let seed = [];
    try {
      seed = require("../data").rolePermissions?.["Super Administrateur Somafrik"] ?? [];
    } catch {
      seed = ["ALL_PRIVILEGES"];
    }

    const merged = new Set([
      ...(Array.isArray(rolePermissions["Super Administrateur Somafrik"])
        ? rolePermissions["Super Administrateur Somafrik"]
        : []),
      ...(Array.isArray(rolePermissions["Super Administrateur OKAFRIK"])
        ? rolePermissions["Super Administrateur OKAFRIK"]
        : []),
      ...seed,
      "ALL_PRIVILEGES",
    ]);

    return {
      ...rolePermissions,
      "Super Administrateur Somafrik": [...merged].sort((left, right) =>
        String(left).localeCompare(String(right), "fr"),
      ),
    };
  }
}

module.exports = { RoleGovernanceService, COUNTRY_SCOPE_MODULES, SUPERADMIN_MANAGED_ROLES };
