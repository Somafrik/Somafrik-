import type { BackOfficeState } from "../types";
import {
  getAllSchoolSubjects,
  getSchoolAcademicLists,
  getSubjectsForClass,
  resolveSubjectsByClass,
} from "./academicConfig";
import { normalize } from "./format";

type Row = Record<string, unknown>;

export function isKnownClassName(
  className: string,
  classes: Row[],
  state: BackOfficeState,
  schoolCode?: string,
): boolean {
  const target = normalize(className);
  if (!target) return false;
  if (classes.some((schoolClass) => normalize(String(schoolClass.name ?? "")) === target)) {
    return true;
  }
  const { classNames } = getSchoolAcademicLists(state, schoolCode);
  return classNames.some((name) => normalize(name) === target);
}

export function isKnownSubjectForClass(
  subject: string,
  className: string,
  courses: Row[],
  state: BackOfficeState,
  schoolCode?: string,
): boolean {
  const targetSubject = normalize(subject);
  const targetClass = normalize(className);
  if (!targetSubject || !targetClass) return false;

  if (
    courses.some(
      (course) =>
        normalize(String(course.name ?? "")) === targetSubject &&
        normalize(String(course.className ?? "")) === targetClass,
    )
  ) {
    return true;
  }

  return getSubjectsForClass(state, schoolCode, className).some(
    (name) => normalize(name) === targetSubject,
  );
}

/** Matière = catalogue pédagogique (classe + matière), sans enseignant. */
export function sanitizeCourseCatalogItem(item: Row): Row {
  const { teacherId: _teacherId, teacherName: _teacherName, ...rest } = item;
  return {
    ...rest,
    name: String(item.name ?? item.subject ?? "").trim(),
    className: String(item.className ?? "").trim(),
  };
}

export function validateCourseCatalogRule(
  item: Row,
  courses: Row[],
  classes: Row[],
  state: BackOfficeState,
  schoolCode?: string,
  editingId?: string,
): string | null {
  const className = String(item.className ?? "").trim();
  const subject = String(item.name ?? item.subject ?? "").trim();

  if (!className || !subject) {
    return "Classe et matière sont obligatoires.";
  }

  if (!isKnownClassName(className, classes, state, schoolCode)) {
    return `La classe « ${className} » n'est pas reconnue. Créez-la d'abord dans Classes.`;
  }

  const duplicate = courses.find((course) => {
    if (editingId && String(course.id) === editingId) return false;
    return (
      normalize(String(course.name ?? "")) === normalize(subject) &&
      normalize(String(course.className ?? "")) === normalize(className)
    );
  });

  if (duplicate) {
    return `La matière « ${subject} » est déjà enregistrée pour la classe ${className}.`;
  }

  return null;
}

export function validateCourseDeletion(
  className: string,
  subject: string,
  state: BackOfficeState,
  schoolCode?: string,
): string | null {
  const targetClass = normalize(className);
  const targetSubject = normalize(subject);
  if (!targetClass || !targetSubject) return "Matière ou classe invalide.";

  const assignments = ((state.assignments ?? []) as Row[]).filter((row) => {
    if (schoolCode && schoolCode !== "*") {
      const rowSchool = normalize(row.schoolCode ?? "");
      if (rowSchool && rowSchool !== normalize(schoolCode)) return false;
    }
    return true;
  });

  const linked = assignments.find(
    (assignment) =>
      normalize(String(assignment.className ?? "")) === targetClass &&
      normalize(String(assignment.subject ?? assignment.course ?? "")) === targetSubject,
  );

  if (linked) {
    return `Suppression refusée : une affectation enseignant existe pour « ${subject} » en ${className}. Retirez l'affectation d'abord.`;
  }

  return null;
}

export function syncClassToAcademicConfig(
  state: BackOfficeState,
  className: string,
  schoolCode?: string,
  previousName?: string,
): BackOfficeState["academicConfigs"] {
  if (!schoolCode || schoolCode === "*") return state.academicConfigs;

  const trimmed = className.trim();
  if (!trimmed) return state.academicConfigs;

  const config = { ...((state.academicConfigs?.[schoolCode] ?? {}) as Record<string, unknown>) };
  const { classNames } = getSchoolAcademicLists(state, schoolCode);
  const names = [...classNames];
  const previous = String(previousName ?? "").trim();

  if (previous && normalize(previous) !== normalize(trimmed)) {
    const idx = names.findIndex((name) => normalize(name) === normalize(previous));
    if (idx >= 0) names[idx] = trimmed;
    else if (!names.some((name) => normalize(name) === normalize(trimmed))) names.push(trimmed);
  } else if (!names.some((name) => normalize(name) === normalize(trimmed))) {
    names.push(trimmed);
  }

  const byClass = resolveSubjectsByClass(config, names);
  if (previous && normalize(previous) !== normalize(trimmed) && byClass[previous]) {
    byClass[trimmed] = byClass[previous];
    delete byClass[previous];
  }

  return {
    ...state.academicConfigs,
    [schoolCode]: {
      ...config,
      schoolCode,
      classNames: [...names].sort((a, b) => a.localeCompare(b, "fr")),
      subjectsByClass: byClass,
      subjects: getAllSchoolSubjects(byClass),
    },
  };
}

function mergeSubjectList(existing: string[], subject: string): string[] {
  const trimmed = subject.trim();
  if (!trimmed) return existing;
  if (existing.some((name) => normalize(name) === normalize(trimmed))) return existing;
  return [...existing, trimmed].sort((a, b) => a.localeCompare(b, "fr"));
}

export function syncCourseToAcademicConfig(
  state: BackOfficeState,
  course: Row,
  schoolCode?: string,
): BackOfficeState["academicConfigs"] {
  if (!schoolCode || schoolCode === "*") return state.academicConfigs;

  const className = String(course.className ?? "").trim();
  const subject = String(course.name ?? course.subject ?? "").trim();
  if (!className || !subject) return state.academicConfigs;

  const config = { ...((state.academicConfigs?.[schoolCode] ?? {}) as Record<string, unknown>) };
  const { classNames } = getSchoolAcademicLists(state, schoolCode);
  const names = classNames.some((name) => normalize(name) === normalize(className))
    ? classNames
    : [...classNames, className].sort((a, b) => a.localeCompare(b, "fr"));
  const byClass = resolveSubjectsByClass(config, names);
  byClass[className] = mergeSubjectList(byClass[className] ?? [], subject);

  return {
    ...state.academicConfigs,
    [schoolCode]: {
      ...config,
      schoolCode,
      classNames: names,
      subjectsByClass: byClass,
      subjects: getAllSchoolSubjects(byClass),
    },
  };
}

export function removeCourseFromAcademicConfig(
  state: BackOfficeState,
  className: string,
  subject: string,
  schoolCode?: string,
): BackOfficeState["academicConfigs"] {
  if (!schoolCode || schoolCode === "*") return state.academicConfigs;

  const trimmedClass = className.trim();
  const trimmedSubject = subject.trim();
  if (!trimmedClass || !trimmedSubject) return state.academicConfigs;

  const config = { ...((state.academicConfigs?.[schoolCode] ?? {}) as Record<string, unknown>) };
  const { classNames } = getSchoolAcademicLists(state, schoolCode);
  const byClass = resolveSubjectsByClass(config, classNames);
  byClass[trimmedClass] = (byClass[trimmedClass] ?? []).filter(
    (name) => normalize(name) !== normalize(trimmedSubject),
  );

  return {
    ...state.academicConfigs,
    [schoolCode]: {
      ...config,
      schoolCode,
      subjectsByClass: byClass,
      subjects: getAllSchoolSubjects(byClass),
    },
  };
}
