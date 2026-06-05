const seedData = require("../data");

const roleAliases = {
  school_admin: "Admin School",
  teacher: "Enseignant",
  student: "Élève / Étudiant",
  parent_student: "Parent",
};

const routePermissions = {
  "GET /api/users": ["Gérer utilisateurs", "Auditer utilisateurs pays", "ALL_PRIVILEGES"],
  "GET /api/payments": ["Gérer paiements", "Voir paiements", "Voir rapports financiers", "Suivre abonnements pays", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/v2/subjects": ["Gérer cours", "Voir classes", "Modifier notes", "Organiser examens", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "POST /api/v2/subjects": ["Gérer cours", "ALL_PRIVILEGES"],
  "DELETE /api/v2/subjects/:code": ["Gérer cours", "ALL_PRIVILEGES"],
  "GET /api/v2/academic-years": ["Valider années académiques", "Gérer planning académique", "Gérer classes", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/v2/exams": ["Valider examens", "Organiser examens", "Gérer cours", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/v2/documents": ["Valider bulletins", "Voir rapports", "Gérer élèves", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/v2/reports/advanced": ["Voir rapports globaux", "Voir rapports pays", "Voir rapports", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/backoffice/countries": ["Contrôler tous les pays", "COUNTRY_PRIVILEGES", "ALL_PRIVILEGES"],
  "GET /api/backoffice/subscriptions": ["Gérer abonnements", "Suivre abonnements pays", "ALL_PRIVILEGES"],
  "GET /api/backoffice/notifications": ["ALL_PRIVILEGES", "COUNTRY_PRIVILEGES"],
};

class RbacService {
  constructor(rolePermissions = seedData.rolePermissions) {
    this.rolePermissions = rolePermissions;
  }

  permissionsFor(role) {
    const label = roleAliases[role] ?? role;
    return this.rolePermissions[label] ?? ["Voir tableau de bord"];
  }

  canAccess(principal, routeKey) {
    const requiredPermissions = routePermissions[routeKey];

    if (!requiredPermissions || process.env.SCHOOLLINK_AUTH_OPTIONAL === "true") {
      return true;
    }

    if (!principal) {
      return false;
    }

    const permissions = new Set(principal.permissions ?? this.permissionsFor(principal.role));
    return requiredPermissions.some((permission) => permissions.has(permission));
  }
}

module.exports = { RbacService, routePermissions };
