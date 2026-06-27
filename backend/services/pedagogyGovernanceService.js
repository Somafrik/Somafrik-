/**
 * Règles métier pédagogie Somafrik :
 * - Classes : structure (nom, niveau, filière).
 * - Matières (courses) : catalogue classe + matière, sans enseignant.
 * - Affectations : seul lien enseignant ↔ classe ↔ matière.
 * - Admin School : ajout d'enseignants uniquement (pas de modification / suppression).
 */

const SCHOOL_ADMIN_ROLE = "Admin School";

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function rowKey(row = {}) {
  return String(row.id ?? row.publicId ?? row.code ?? row.schoolCode ?? row.value ?? "");
}

class PedagogyGovernanceService {
  isSchoolAdmin(principal) {
    return principal?.role === SCHOOL_ADMIN_ROLE;
  }

  /** Retire les droits de modification / suppression enseignants pour Admin School. */
  sanitizeSchoolAdminRolePermissions(rolePermissions = {}) {
    const next = { ...rolePermissions };
    const schoolPerms = new Set(next[SCHOOL_ADMIN_ROLE] ?? []);
    [
      "Enseignants:UPDATE",
      "Enseignants:DELETE",
      "Enseignants:SUSPEND",
      "Gérer enseignants",
    ].forEach((token) => schoolPerms.delete(token));
    schoolPerms.add("Enseignants:READ");
    schoolPerms.add("Enseignants:CREATE");
    schoolPerms.add("Ajouter enseignants");
    schoolPerms.add("Voir enseignants");
    next[SCHOOL_ADMIN_ROLE] = [...schoolPerms].sort((a, b) => String(a).localeCompare(String(b), "fr"));
    return next;
  }

  /** Valide l'ensemble des matières avant persistance (classe + matière unique). */
  validateCoursesCollection(courses = []) {
    for (const course of courses) {
      const error = this.validateCourseCatalogRule(course, courses, rowKey(course));
      if (error) return error;
    }
    return null;
  }

  /** Nettoie les champs enseignant des matières (source de vérité = affectations). */
  sanitizeCourseCatalog(courses = []) {
    return courses.map((course) => {
      const { teacherId: _teacherId, teacherName: _teacherName, ...rest } = course;
      return {
        ...rest,
        name: String(course.name ?? course.subject ?? "").trim(),
        className: String(course.className ?? "").trim(),
      };
    });
  }

  /** @deprecated Conservé pour compatibilité lecture — ne plus hydrater les enseignants dans courses. */
  hydrateCoursesFromAssignments(courses = [], _assignments = []) {
    return this.sanitizeCourseCatalog(courses);
  }

  /** Cours créés ou modifiés depuis l'état courant (évite de bloquer toute la sync). */
  listChangedCourses(before = [], after = []) {
    const beforeMap = new Map(before.map((row) => [rowKey(row), row]).filter(([key]) => key));

    return after.filter((row) => {
      const key = rowKey(row);
      const previous = key ? beforeMap.get(key) : undefined;
      if (!previous) return true;

      return (
        normalize(previous.className) !== normalize(row.className)
        || normalize(previous.name ?? previous.subject) !== normalize(row.name ?? row.subject)
      );
    });
  }

  /** Admin School : conserve les enseignants existants, autorise uniquement les créations. */
  enforceSchoolAdminTeachers(currentTeachers = [], mergedTeachers = [], scopedCurrentTeachers = []) {
    const currentByKey = new Map(
      scopedCurrentTeachers.map((row) => [rowKey(row), row]).filter(([key]) => key),
    );

    const preservedKeys = new Set();
    const nextTeachers = [];

    for (const teacher of mergedTeachers) {
      const key = rowKey(teacher);
      const existing = key ? currentByKey.get(key) : undefined;

      if (existing) {
        preservedKeys.add(key);
        nextTeachers.push(existing);
        continue;
      }

      nextTeachers.push(teacher);
    }

    for (const teacher of currentTeachers) {
      const key = rowKey(teacher);
      if (!key || preservedKeys.has(key)) continue;
      if (!currentByKey.has(key)) continue;
      nextTeachers.push(teacher);
    }

    return nextTeachers;
  }

  /** Bloque la suppression d'enseignants par Admin School. */
  filterSchoolAdminDeletedRows(deletedRows = {}, principal) {
    if (!this.isSchoolAdmin(principal)) return deletedRows;
    const next = { ...deletedRows };
    delete next.teachers;
    return next;
  }

  validateCourseCatalogRule(item = {}, courses = [], editingId) {
    const className = String(item.className ?? "").trim();
    const subject = String(item.name ?? item.subject ?? "").trim();

    if (!className || !subject) {
      return "Classe et matière sont obligatoires.";
    }

    const duplicateCourse = courses.find((course) => {
      if (editingId && String(course.id) === String(editingId)) return false;
      return (
        normalize(course.name ?? course.subject) === normalize(subject)
        && normalize(String(course.className ?? "")) === normalize(className)
      );
    });

    if (duplicateCourse) {
      return `La matière « ${subject} » est déjà enregistrée pour la classe ${className}.`;
    }

    return null;
  }

  /** @deprecated Utiliser validateCourseCatalogRule */
  validateCourseTeacherRule(item = {}, courses = [], _assignments = [], editingId) {
    return this.validateCourseCatalogRule(item, courses, editingId);
  }

  enforceCourseTeacherUniqueness(currentCourses = [], mergedCourses = [], scopedCurrentCourses = []) {
    return this.enforceCourseCatalogUniqueness(currentCourses, mergedCourses, scopedCurrentCourses);
  }

  enforceCourseCatalogUniqueness(currentCourses = [], mergedCourses = [], scopedCurrentCourses = []) {
    const currentByKey = new Map(
      scopedCurrentCourses.map((row) => [rowKey(row), row]).filter(([key]) => key),
    );

    const sanitized = this.sanitizeCourseCatalog(mergedCourses);

    return sanitized.map((course) => {
      const key = rowKey(course);
      const previous = key ? currentByKey.get(key) : undefined;
      if (!previous) return course;

      const className = normalize(course.className);
      const subject = normalize(course.name ?? course.subject);
      const conflict = sanitized.find((other) => {
        if (rowKey(other) === key) return false;
        return normalize(other.className) === className && normalize(other.name ?? other.subject) === subject;
      });

      if (conflict) {
        return previous;
      }

      const validationError = this.validateCourseCatalogRule(course, sanitized, key);
      if (validationError) {
        return previous;
      }

      return course;
    });
  }
}

module.exports = { PedagogyGovernanceService, SCHOOL_ADMIN_ROLE };
