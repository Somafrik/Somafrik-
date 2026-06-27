import type { BackOfficeState } from "../types";
import {
  isKnownClassName,
  isKnownSubjectForClass,
  validateCourseCatalogRule,
  validateCourseDeletion,
} from "./pedagogyEntities";

type Row = Record<string, unknown>;

export {
  isKnownClassName,
  isKnownSubjectForClass,
  validateCourseCatalogRule,
  validateCourseDeletion,
};

/** @deprecated Utiliser validateCourseCatalogRule — les matières n'ont plus d'enseignant. */
export function validateCourseTeacherRule(
  item: Row,
  courses: Row[],
  _assignments: Row[] = [],
  editingId?: string,
  state?: BackOfficeState,
  schoolCode?: string,
  classes: Row[] = [],
): string | null {
  if (state) {
    return validateCourseCatalogRule(item, courses, classes, state, schoolCode, editingId);
  }

  const className = String(item.className ?? "").trim();
  const subject = String(item.name ?? item.subject ?? "").trim();
  if (!className || !subject) return "Classe et matière sont obligatoires.";

  const duplicate = courses.find((course) => {
    if (editingId && String(course.id) === editingId) return false;
    return (
      String(course.name ?? "").trim().toLowerCase() === subject.toLowerCase() &&
      String(course.className ?? "").trim().toLowerCase() === className.toLowerCase()
    );
  });

  if (duplicate) {
    return `La matière « ${subject} » est déjà enregistrée pour la classe ${className}.`;
  }

  return null;
}

/** Admin School : création d'enseignants uniquement. */
export function canSchoolAdminMutateTeachers(action: string): boolean {
  return action === "READ" || action === "CREATE";
}
