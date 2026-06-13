import type { AdminEntity } from "../../context/AdminDataContext";

export type SecurityAction = "READ" | "CREATE" | "UPDATE" | "DELETE";

const crudActions: SecurityAction[] = ["READ", "CREATE", "UPDATE", "DELETE"];

export const entityFeatureMap: Partial<Record<AdminEntity, string>> = {
  schools: "Établissements",
  countries: "Pays",
  users: "Utilisateurs",
  classes: "Classes",
  students: "Élèves",
  teachers: "Enseignants",
  payments: "Paiements",
  subscriptions: "Abonnements",
  paymentStatuses: "Paiements",
  messages: "Messages",
  announcements: "Notifications",
  courses: "Matières",
  assignments: "Matières",
};

export const routeFeatureMap: Record<string, string> = {
  Profil: "Élèves",
  StudentDetail: "Élèves",
  StudentNotes: "Notes",
  StudentPresences: "Présences",
  Classes: "Classes",
  Teachers: "Enseignants",
  Students: "Élèves",
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
  Documents: "Élèves",
  Reports: "Rapports",
  Audit: "Utilisateurs",
  Support: "Messages",
  MobilePayment: "Paiements",
  OfflineMode: "Élèves",
  Synchronization: "Élèves",
};

export function hasSecurityPermission(session: any, feature: string | undefined, action: SecurityAction = "READ") {
  if (!feature) {
    return true;
  }

  const permissions = new Set(session?.permissions ?? session?.user?.permissions ?? []);

  if (permissions.has("ALL_PRIVILEGES") || permissions.has("COUNTRY_PRIVILEGES")) {
    return true;
  }

  if (feature === "Pays") {
    return permissions.has("Contrôler tous les pays");
  }

  if (feature === "Abonnements") {
    return permissions.has("Gérer abonnements") || permissions.has("Suivre abonnements pays");
  }

  return permissions.has(`${feature}:${action}`);
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
  return actions.map((action) => action === "READ" ? action : action).map((action) => action);
}
