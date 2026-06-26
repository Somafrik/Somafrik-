/**
 * Règles métier pédagogie Somafrik :
 * - Admin School : ajout d'enseignants uniquement (pas de modification / suppression).
 * - Un cours (matière + classe) est affecté à un seul enseignant.
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

function sameTeacherReference(left = {}, right = {}) {
  const leftId = normalize(left.teacherId);
  const rightId = normalize(right.teacherId);
  if (leftId && rightId && leftId === rightId) return true;

  const leftName = normalize(left.teacherName);
  const rightName = normalize(right.teacherName);
  return Boolean(leftName && rightName && leftName === rightName);
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

  /** Valide l'ensemble des cours avant persistance (matière + classe = un seul enseignant). */
  validateCoursesCollection(courses = [], assignments = []) {
    for (const course of courses) {
      const error = this.validateCourseTeacherRule(course, courses, assignments, rowKey(course));
      if (error) return error;
    }
    return null;
  }

  /** Complète teacherId/teacherName depuis les affectations si absents (données legacy). */
  hydrateCoursesFromAssignments(courses = [], assignments = []) {
    return courses.map((course) => {
      if (String(course.teacherId ?? "").trim() || String(course.teacherName ?? "").trim()) {
        return course;
      }

      const className = String(course.className ?? "").trim();
      const subject = String(course.name ?? course.subject ?? "").trim();
      const match = assignments.find((assignment) => {
        return (
          String(assignment.className ?? "").trim() === className
          && normalize(String(assignment.course ?? assignment.subject ?? "")) === normalize(subject)
        );
      });

      if (!match) return course;

      return {
        ...course,
        teacherId: match.teacherId ?? course.teacherId,
        teacherName: match.teacherName ?? course.teacherName,
      };
    });
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
        || normalize(previous.teacherId) !== normalize(row.teacherId)
        || normalize(previous.teacherName) !== normalize(row.teacherName)
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

  validateCourseTeacherRule(item = {}, courses = [], assignments = [], editingId) {
    const className = String(item.className ?? "").trim();
    const subject = String(item.name ?? item.subject ?? "").trim();
    const teacherId = String(item.teacherId ?? "").trim();
    const teacherName = String(item.teacherName ?? "").trim();

    if (!className || !subject) {
      return "Classe et matière sont obligatoires.";
    }

    if (!teacherId && !teacherName) {
      return "Sélectionnez l'enseignant responsable de ce cours pour cette classe.";
    }

    const duplicateCourse = courses.find((course) => {
      if (editingId && String(course.id) === String(editingId)) return false;
      return (
        normalize(course.name) === normalize(subject) &&
        normalize(String(course.className ?? "")) === normalize(className)
      );
    });

    if (duplicateCourse && !sameTeacherReference(duplicateCourse, item)) {
      const assigned =
        duplicateCourse.teacherName ||
        duplicateCourse.teacherId ||
        "un autre enseignant";
      return `Le cours « ${subject} » est déjà affecté à ${assigned} pour la classe ${className}.`;
    }

    const duplicateAssignment = assignments.find((assignment) => {
      if (editingId && String(assignment.courseId ?? assignment.id) === String(editingId)) return false;
      return (
        normalize(String(assignment.className ?? "")) === normalize(className) &&
        normalize(String(assignment.subject ?? assignment.course ?? "")) === normalize(subject)
      );
    });

    if (duplicateAssignment && !sameTeacherReference(duplicateAssignment, item)) {
      const assigned =
        duplicateAssignment.teacherName ||
        duplicateAssignment.teacherId ||
        "un autre enseignant";
      return `Le cours « ${subject} » est déjà affecté à ${assigned} pour la classe ${className}.`;
    }

    return null;
  }

  enforceCourseTeacherUniqueness(currentCourses = [], mergedCourses = [], scopedCurrentCourses = []) {
    const currentByKey = new Map(
      scopedCurrentCourses.map((row) => [rowKey(row), row]).filter(([key]) => key),
    );

    return mergedCourses.map((course) => {
      const key = rowKey(course);
      const previous = key ? currentByKey.get(key) : undefined;
      if (!previous) return course;

      const className = normalize(course.className);
      const subject = normalize(course.name);
      const conflict = mergedCourses.find((other) => {
        if (rowKey(other) === key) return false;
        return normalize(other.className) === className && normalize(other.name) === subject;
      });

      if (conflict && !sameTeacherReference(conflict, course)) {
        return previous;
      }

      const validationError = this.validateCourseTeacherRule(course, mergedCourses, [], key);
      if (validationError && !sameTeacherReference(previous, course)) {
        return previous;
      }

      return course;
    });
  }
}

module.exports = { PedagogyGovernanceService, SCHOOL_ADMIN_ROLE };
