import type { AdminEntity } from "../../context/AdminDataContext";

export type SecurityAction = "READ" | "CREATE" | "UPDATE" | "DELETE" | "SUSPEND";

export const SUPER_ADMIN_ROLE = "Super Administrateur Somafrik";
export const LEGACY_SUPER_ADMIN_ROLE = "Super Administrateur OKAFRIK";

export function isSuperAdminRole(role?: string) {
  return role === SUPER_ADMIN_ROLE || role === LEGACY_SUPER_ADMIN_ROLE;
}

const crudActions: SecurityAction[] = ["READ", "CREATE", "UPDATE", "DELETE", "SUSPEND"];
const schoolAdminForbiddenFeatures = new Set(["Établissements", "Abonnements"]);

export const entityFeatureMap: Partial<Record<AdminEntity, string>> = {
  schools: "Établissements",
  countries: "Pays",
  users: "Utilisateurs",
  classes: "Classes",
  students: "Élèves",
  teachers: "Enseignants",
  payments: "Paiements",
  subscriptions: "Abonnements",
  paymentStatuses: "Paramètres Établissement",
  messages: "Messages",
  announcements: "Notifications",
  courses: "Matières",
  assignments: "Affectations",
};

export const routeFeatureMap: Record<string, string> = {
  Profil: "Élèves",
  StudentDetail: "Élèves",
  StudentNotes: "Notes",
  StudentPresences: "Présences",
  Classes: "Classes",
  Teachers: "Enseignants",
  Students: "Élèves",
  Users: "Utilisateurs",
  TeacherStudents: "Élèves",
  TeacherAttendance: "Présences",
  TeacherGrades: "Notes",
  Notes: "Notes",
  Presences: "Présences",
  FraisEleve: "Paiements",
  StudentPayments: "Paiements",
  SchoolManagement: "Établissements",
  Payments: "Paiements",
  Paiements: "Paiements",
  Messages: "Messages",
  Announcements: "Notifications",
  Timetable: "Années Académiques",
  ReportCards: "Bulletins",
  Documents: "Documents",
  Reports: "Rapports",
  Audit: "Utilisateurs",
  Support: "Messages",
  MobilePayment: "Paiements",
  OfflineMode: "Documents",
  Synchronization: "Documents",
};

function normalize(value?: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const COUNTRY_PRIVILEGE_FEATURES = new Set([
  "pays",
  "etablissements",
  "abonnements",
  "utilisateurs",
  "rapports",
]);

function countryPrivilegeAllows(normalizedFeature: string, action: SecurityAction) {
  if (!COUNTRY_PRIVILEGE_FEATURES.has(normalizedFeature)) {
    return false;
  }
  if (normalizedFeature === "pays") {
    return action === "READ";
  }
  return true;
}

function permissionMatchesFeature(
  normalizedPermission: string,
  normalizedFeature: string,
  action: SecurityAction,
): boolean {
  if (normalizedPermission === "country-privileges") {
    return countryPrivilegeAllows(normalizedFeature, action);
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
      normalizedPermission.includes("modifier")
    );
  }
  return (
    normalizedPermission.includes(normalize(action)) ||
    normalizedPermission.includes("gerer") ||
    normalizedPermission.includes("crud")
  );
}

export function resolveEffectivePermissions(
  role: string | undefined,
  userPermissions: string[] | undefined,
  rolePermissions: Record<string, string[]> = {},
): string[] {
  const fromUser = userPermissions ?? [];
  const fromRole =
    role && Array.isArray(rolePermissions[role])
      ? rolePermissions[role]
      : isSuperAdminRole(role) && Array.isArray(rolePermissions[LEGACY_SUPER_ADMIN_ROLE])
        ? rolePermissions[LEGACY_SUPER_ADMIN_ROLE]
        : [];
  return [...new Set([...fromUser, ...fromRole])];
}

export function roleLabelFromSessionRole(role?: string) {
  if (role === "super_admin") return "Super Administrateur Somafrik";
  if (role === "country_admin") return "Admin Pays";
  if (role === "school_admin") return "Admin School";
  if (role === "principal" || role === "prefet") return "Préfet des études";
  if (role === "secretary") return "Secrétaire";
  if (role === "teacher") return "Enseignant";
  if (role === "parent_student") return "Parent";
  if (role === "student") return "Élève / Étudiant";
  return role;
}

export function hasSecurityPermission(session: any, feature: string | undefined, action: SecurityAction = "READ") {
  if (!feature) {
    return true;
  }

  if ((session?.role === "school_admin" || session?.user?.role === "Admin School") && schoolAdminForbiddenFeatures.has(feature)) {
    return false;
  }

  const permissions = new Set<string>(session?.permissions ?? session?.user?.permissions ?? []);

  if (permissions.has("ALL_PRIVILEGES")) {
    return true;
  }

  if (permissions.has("COUNTRY_PRIVILEGES")) {
    return countryPrivilegeAllows(normalize(feature), action);
  }

  if (permissions.has(`${feature}:CRUD`)) {
    return true;
  }

  if (action === "READ" && (permissions.has(`${feature}:R`) || permissions.has(`${feature}:READ`))) {
    return true;
  }

  if (permissions.has(`${feature}:${action}`)) {
    return true;
  }

  if (feature === "Pays") {
    return permissions.has("Contrôler tous les pays");
  }

  if (feature === "Abonnements") {
    return (
      permissions.has("Gérer abonnements") ||
      permissions.has("Suivre abonnements pays")
    );
  }

  if (feature === "Affectations") {
    return (
      permissions.has("Gérer affectations") ||
      permissions.has("Gérer enseignants") ||
      permissions.has("Enseignants:CRUD")
    );
  }

  const normalizedFeature = normalize(feature);
  return [...permissions].some((permission) => {
    const normalizedPermission = normalize(permission);
    if (
      normalizedPermission === "country-privileges" &&
      ["etablissements", "abonnements", "utilisateurs", "rapports"].includes(normalizedFeature)
    ) {
      return true;
    }
    return permissionMatchesFeature(normalizedPermission, normalizedFeature, action);
  });
}

export function canReadEntity(session: any, entity?: AdminEntity) {
  const feature = entity ? entityFeatureMap[entity] : undefined;
  return Boolean(feature) && hasSecurityPermission(session, feature, "READ");
}

export function canMutateEntity(session: any, entity: AdminEntity, action: Exclude<SecurityAction, "READ">) {
  const feature = entityFeatureMap[entity];
  return Boolean(feature) && hasSecurityPermission(session, feature, action);
}

export function canReadRoute(session: any, routeName?: string) {
  const feature = routeName ? routeFeatureMap[routeName] : undefined;
  return Boolean(feature) && hasSecurityPermission(session, feature, "READ");
}

export function matrixPermissions(access: "R" | "CRUD" | "-") {
  if (access === "-") {
    return [];
  }

  const actions = access === "CRUD" ? crudActions : ["READ"];
  return actions.map((action) => action);
}
