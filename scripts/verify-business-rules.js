/**
 * Vérifie les 3 règles métier :
 * 1. Compte utilisateur obligatoire avant accès aux fonctionnalités
 * 2. Tous les rôles configurables
 * 3. Traçabilité des tâches critiques
 *
 * Usage: node scripts/verify-business-rules.js
 */
const fs = require("fs");
const path = require("path");
const seedData = require("../backend/data");

const ROOT = path.join(__dirname, "..");
const authServiceSource = fs.readFileSync(
  path.join(ROOT, "backend/services/authService.js"),
  "utf8"
);
const serverSource = fs.readFileSync(path.join(ROOT, "backend/server.js"), "utf8");

const EXPECTED_CRITICAL_AUDIT_ACTIONS = [
  "mobile_login",
  "backoffice_login",
  "logout",
  "change_own_password",
  "reset_user_password",
  "upsert_grade",
  "upsert_attendance",
  "save_academic_config",
  "sync_backoffice_state",
  "create_subject",
  "delete_subject",
  "create_user",
  "update_user",
  "delete_user",
  "create_payment",
  "update_payment",
  "delete_payment",
  "create_bulletin",
  "update_bulletin",
  "delete_bulletin",
  "update_role_permissions",
];

const PLATFORM_ROLES = new Set([
  "Super Administrateur Somafrik",
  "Super Administrateur OKAFRIK",
  "Admin Pays",
  "Admin School",
]);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function auditRule1() {
  const issues = [];
  const legacyBypass =
    authServiceSource.includes("if (role === \"teacher\")") &&
    authServiceSource.includes("this.findTeacher(accountIdentifier");
  if (legacyBypass) {
    issues.push("Connexion mobile : bypass enseignant via teachers[] sans compte users");
  }

  const legacyStudent =
    authServiceSource.includes("if (role === \"student\")") &&
    authServiceSource.includes("this.findStudent(accountIdentifier");
  if (legacyStudent) {
    issues.push("Connexion mobile : bypass élève via students[] sans compte users");
  }

  const legacyParent =
    authServiceSource.includes("if (role === \"parent_student\")") &&
    authServiceSource.includes("this.findParentStudents(accountIdentifier");
  if (legacyParent) {
    issues.push("Connexion mobile : bypass parent via téléphone élève sans compte users");
  }

  const adminBypass = authServiceSource.includes("accountIdentifier.isAdmin()");
  if (adminBypass) {
    issues.push("Identification : bypass identifiant admin sans compte users");
  }

  const teachersWithoutUser = (seedData.teachers ?? []).filter(
    (teacher) => !teacher.userId && !seedData.userAccounts.some((user) => normalize(user.identifier) === normalize(teacher.identifier))
  );
  if (teachersWithoutUser.length) {
    issues.push(
      `Seed : ${teachersWithoutUser.length} fiche(s) teachers sans compte users lié`
    );
  }

  const students = seedData.students ?? [];
  const studentUsers = (seedData.userAccounts ?? []).filter((user) =>
    normalize(user.role).includes("eleve") || normalize(user.role).includes("etudiant")
  );
  const studentsWithoutUser = students.filter(
    (student) =>
      !studentUsers.some(
        (user) =>
          normalize(user.identifier) === normalize(student.matricule) ||
          String(user.id) === String(student.id)
      )
  );
  if (studentsWithoutUser.length && students.length <= 10) {
    issues.push(
      `Seed : ${studentsWithoutUser.length} élève(s) sans compte users (matricule ${studentsWithoutUser.map((s) => s.matricule).join(", ")})`
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    checks: {
      managedRolesIncludeEnseignant: authServiceSource.includes("Enseignant: { role: \"teacher\""),
      managedRolesIncludeParent: authServiceSource.includes("Parent: { role: \"parent_student\""),
      managedRolesIncludeStudent: authServiceSource.includes("Élève / Étudiant"),
      requireUserAccountMessage: authServiceSource.includes("Compte utilisateur requis"),
    },
  };
}

function auditRule2() {
  const issues = [];
  const rolePermissions = seedData.rolePermissions ?? {};
  const configuredRoles = Object.keys(rolePermissions);
  const userRolesInUse = [...new Set((seedData.userAccounts ?? []).map((user) => user.role))];
  const defaultUserRoles = [
    "Secrétaire",
    "Préfet des études",
    "Enseignant",
    "Parent",
    "Élève / Étudiant",
    "Comptable",
    "Proviseur / Directeur",
  ];

  for (const role of defaultUserRoles) {
    const hasPermissions =
      configuredRoles.includes(role) ||
      rolePermissions[role] ||
      (role === "Proviseur / Directeur" && (rolePermissions.Proviseur || rolePermissions["Préfet des études"]));
    if (!hasPermissions) {
      issues.push(`Rôle par défaut « ${role} » sans entrée rolePermissions seed`);
    }
  }

  const rolesWithoutPermissions = userRolesInUse.filter(
    (role) => !PLATFORM_ROLES.has(role) && !rolePermissions[role] && !role.includes("démo")
  );
  if (rolesWithoutPermissions.length) {
    issues.push(
      `Rôles utilisés sans permissions seed : ${rolesWithoutPermissions.slice(0, 8).join(", ")}`
    );
  }

  const webConfigurable =
    fs.existsSync(path.join(ROOT, "web/src/pages/ConfigurationPage.tsx")) &&
    fs.readFileSync(path.join(ROOT, "web/src/pages/ConfigurationPage.tsx"), "utf8").includes("userRoles");
  const permissionsPage =
    fs.existsSync(path.join(ROOT, "web/src/pages/PermissionsPage.tsx"));

  return {
    ok: issues.length === 0,
    issues,
    checks: {
      webUserRolesConfigurable: webConfigurable,
      webPermissionsPage: permissionsPage,
      webRolePilotage: fs
        .readFileSync(path.join(ROOT, "web/src/pages/ConfigurationPage.tsx"), "utf8")
        .includes("Pilotage des rôles"),
      backendRolePermissionsMerge: serverSource.includes("mergeScopedRolePermissions"),
      seedRoleCount: configuredRoles.length,
    },
  };
}

function auditRule3() {
  const issues = [];
  const foundActions = new Set();
  const auditMatches = serverSource.matchAll(/auditService\.record\(req,\s*"([^"]+)"/g);
  for (const match of auditMatches) {
    foundActions.add(match[1]);
  }
  const recordAuditMatches = serverSource.matchAll(/action:\s*"([^"]+)"/g);
  for (const match of recordAuditMatches) {
    foundActions.add(match[1]);
  }

  const loginAudited =
    serverSource.includes("sendAuthenticatedResponse") &&
    serverSource.includes("await repository.recordAudit") &&
    serverSource.includes("action,");
  if (!loginAudited) {
    issues.push("Connexions mobile/backoffice non auditées via recordAudit");
  }

  const granularUserAudit = serverSource.includes("auditCriticalStateChanges");
  const auditEndpoint = serverSource.includes("app.get(\"/api/audit\"");

  if (!granularUserAudit) {
    issues.push("Pas d'audit granulaire users/paiements/bulletins sur PUT /backoffice/state");
  }

  const missing = EXPECTED_CRITICAL_AUDIT_ACTIONS.filter((action) => {
    if (["mobile_login", "backoffice_login"].includes(action)) {
      return !loginAudited;
    }
    if (
      ["create_user", "update_user", "delete_user", "create_payment", "update_payment", "delete_payment", "create_bulletin", "update_bulletin", "delete_bulletin", "update_role_permissions"].includes(action) &&
      granularUserAudit
    ) {
      return false;
    }
    return !foundActions.has(action);
  });

  for (const action of missing) {
    issues.push(`Action critique non auditée explicitement : ${action}`);
  }

  const noteAuditInData = (seedData.notes ?? []).some((note) => Array.isArray(note.audit) && note.audit.length);
  if (!noteAuditInData) {
    issues.push("Notes seed sans historique audit local");
  }

  return {
    ok: issues.length === 0,
    issues,
    checks: {
      auditEndpoint,
      loginAudited,
      granularStateAudit: granularUserAudit,
      auditedActions: [...foundActions].sort(),
      noteLevelAuditTrail: noteAuditInData,
      userHistoryField: (seedData.userAccounts ?? []).some((user) => Array.isArray(user.history)),
    },
  };
}

function printSection(title, result) {
  console.log(`\n=== ${title} ===`);
  console.log(`Statut : ${result.ok ? "CONFORME" : "ÉCARTS"}`);
  console.log("Vérifications :", JSON.stringify(result.checks, null, 2));
  if (result.issues.length) {
    console.log("Écarts :");
    result.issues.forEach((issue) => console.log(`  - ${issue}`));
  }
}

function main() {
  const rule1 = auditRule1();
  const rule2 = auditRule2();
  const rule3 = auditRule3();

  console.log("Audit des 3 règles métier Somafrik");
  printSection("Règle 1 — Compte utilisateur obligatoire", rule1);
  printSection("Règle 2 — Rôles configurables", rule2);
  printSection("Règle 3 — Traçabilité tâches critiques", rule3);

  const allOk = rule1.ok && rule2.ok && rule3.ok;
  console.log(`\n>>> Résultat global : ${allOk ? "CONFORME" : "ÉCARTS À TRAITER"}`);
  if (!allOk) {
    process.exitCode = 1;
  }
}

main();
