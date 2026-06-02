class AuditTrailService {
  create(action, actorId, entity, entityId, details = {}) {
    return {
      id: `AUD-${Date.now()}`,
      action,
      actorId,
      entity,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
  }
}

class StudentLifecycleService {
  constructor({ students, classes }) {
    this.students = students;
    this.classes = classes;
  }

  validateClassAssignment(className) {
    if (!this.classes.some((schoolClass) => schoolClass.name === className)) {
      throw new Error("Classe inexistante");
    }
  }

  getAcademicHistory(studentId) {
    const student = this.students.find((item) => item.id === studentId);

    if (!student) {
      throw new Error("Élève introuvable");
    }

    return [
      {
        schoolCode: student.schoolCode,
        className: student.className,
        status: student.archived ? "Archivé" : "Actif",
        year: "2025-2026",
      },
    ];
  }

  prepareTransfer(studentId, targetSchoolCode, targetClassName) {
    const student = this.students.find((item) => item.id === studentId);

    if (!student) {
      throw new Error("Élève introuvable");
    }

    return {
      studentId,
      fromSchoolCode: student.schoolCode,
      fromClassName: student.className,
      targetSchoolCode,
      targetClassName,
      status: "En attente",
    };
  }
}

class ClassManagementService {
  constructor({ classes, students }) {
    this.classes = classes;
    this.students = students;
  }

  getClassSize(className) {
    return this.students.filter((student) => student.className === className && !student.archived).length;
  }

  getClassSummary() {
    return this.classes.map((schoolClass) => ({
      ...schoolClass,
      students: this.getClassSize(schoolClass.name),
      academicYear: "2025-2026",
    }));
  }
}

class SubjectManagementService {
  constructor({ courses, notes }) {
    this.courses = courses;
    this.notes = notes;
  }

  canDeleteSubject(subjectName, className) {
    const used = this.notes.some((note) => note.subject === subjectName);

    return {
      allowed: !used,
      reason: used ? "Matière déjà utilisée dans des notes" : "",
      subjectName,
      className,
    };
  }

  getSubjectsByClass(className) {
    return this.courses.filter((course) => course.className === className);
  }
}

class FinanceService {
  constructor({ payments }) {
    this.payments = payments;
  }

  getPaymentHistory(studentId) {
    return this.payments.filter((payment) => payment.studentId === studentId);
  }

  getFinancialReport() {
    const paid = this.payments.filter((payment) => payment.status === "PAYE");
    const pending = this.payments.filter((payment) => payment.status !== "PAYE");

    return {
      paidAmount: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      pendingAmount: pending.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }
}

class ParentPortalPolicy {
  constructor({ students }) {
    this.students = students;
  }

  getChildren(parentPhone) {
    return this.students.filter((student) => student.parentPhone === parentPhone);
  }

  canAccessChild(parentPhone, studentId) {
    return this.getChildren(parentPhone).some((student) => student.id === studentId);
  }
}

class AcademicYearService {
  getCurrentYear() {
    return {
      id: "YEAR-2025-2026",
      label: "2025-2026",
      status: "Ouverte",
      startDate: "01-09-2025",
      endDate: "31-08-2026",
    };
  }

  canPromoteNextYear() {
    return {
      allowed: true,
      nextYear: "2026-2027",
      requiredActions: ["Archiver les bulletins", "Clôturer les paiements", "Valider les passages"],
    };
  }
}

class DocumentService {
  getTemplates() {
    return [
      { type: "Certificat de scolarité", format: "PDF", status: "À générer" },
      { type: "Relevé de notes", format: "PDF", status: "À générer" },
      { type: "Bulletin", format: "PDF", status: "Structure prête" },
      { type: "Attestation", format: "PDF", status: "À générer" },
    ];
  }
}

class SecurityPolicyService {
  getPolicy() {
    return {
      authentication: "Identifiant + mot de passe",
      passwordReset: "À formaliser",
      twoFactorAuthentication: "Prévu MVP+",
      sessionManagement: "Session applicative locale",
      rolePermissions: "Permissions par rôle déjà formalisées",
      transportEncryption: "HTTPS requis en production",
    };
  }
}

class MobileRolePolicyService {
  getCapabilities() {
    return {
      Enseignant: ["Saisie des notes", "Gestion des présences", "Consultation emploi du temps", "Communication parents"],
      Parent: ["Consultation résultats", "Consultation absences", "Consultation paiements", "Réception notifications"],
      "Élève / Étudiant": ["Consultation notes", "Consultation emploi du temps", "Consultation annonces"],
    };
  }
}

class MvpBusinessService {
  constructor({ school, students, classes, courses, notes, payments }) {
    this.school = school;
    this.auditTrail = new AuditTrailService();
    this.students = new StudentLifecycleService({ students, classes });
    this.classes = new ClassManagementService({ classes, students });
    this.subjects = new SubjectManagementService({ courses, notes });
    this.finance = new FinanceService({ payments });
    this.parents = new ParentPortalPolicy({ students });
    this.academicYears = new AcademicYearService();
    this.documents = new DocumentService();
    this.security = new SecurityPolicyService();
    this.mobileRoles = new MobileRolePolicyService();
  }

  getReadiness() {
    return {
      schoolCode: this.school.code,
      status: "MVP formalisé POO",
      modules: [
        this.module("Élèves / étudiants", "Partiel", ["CRUD existant", "Affectation classe", "Historique scolaire formalisé", "Transfert formalisé", "Archivage formalisé"]),
        this.module("Classes", "Partiel", ["CRUD existant", "Effectifs calculés", "Année scolaire formalisée"]),
        this.module("Matières", "Partiel", ["CRUD existant", "Coefficients", "Affectation classe", "Blocage suppression si notes"]),
        this.module("Emplois du temps", "À formaliser", ["Conflits horaires", "Salles", "Consultation par rôle"]),
        this.module("Finances", "Partiel", ["Paiements existants", "Historique", "Rapport financier minimal"]),
        this.module("Parents / tuteurs", "Partiel", ["Liaison parent-enfant", "Résultats", "Présences", "Paiements", "Messagerie"]),
        this.module("Documents", "Partiel", ["Bulletin structuré", "Templates PDF formalisés"]),
        this.module("Communication", "Partiel", ["Messages", "Notifications", "Badges", "Audit"]),
        this.module("Années académiques", "Formalisé", ["Ouverture/Fermeture", "Passage année suivante", "Archivage"]),
        this.module("Examens", "Partiel", ["Évaluations et résultats via notes/bulletins"]),
        this.module("Bibliothèque", "À formaliser", ["Catalogue", "Emprunts", "Retours", "Retards"]),
        this.module("Transport", "À formaliser", ["Bus", "Circuits", "Affectations", "Paiements"]),
        this.module("Internat", "À formaliser", ["Chambres", "Occupation", "Paiements"]),
        this.module("Rapports", "Partiel", ["Académique", "Financier", "Présence"]),
        this.module("Rôles mobiles", "Formalisé", Object.keys(this.mobileRoles.getCapabilities())),
        this.module("Mode hors connexion", "À formaliser", ["Consultation locale", "Synchronisation", "Conflits"]),
        this.module("Audit", "Formalisé", ["Journal des actions", "Historique modifications", "Connexions à brancher"]),
        this.module("Paramètres établissement", "Partiel", ["Logo", "Devise", "Langue", "Fuseau", "Académique", "Financier"]),
        this.module("Sécurité", "Partiel", ["Authentification", "Permissions par rôle", "Réinitialisation à formaliser"]),
      ],
    };
  }

  getSnapshot() {
    return {
      academicYear: this.academicYears.getCurrentYear(),
      classSummary: this.classes.getClassSummary(),
      financialReport: this.finance.getFinancialReport(),
      documentTemplates: this.documents.getTemplates(),
      mobileCapabilities: this.mobileRoles.getCapabilities(),
      securityPolicy: this.security.getPolicy(),
    };
  }

  module(name, status, rules) {
    return { name, status, rules };
  }
}

module.exports = { MvpBusinessService };
