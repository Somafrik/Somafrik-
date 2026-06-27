import type { BackOfficeState } from "../types";
import { normalize } from "./format";
import {
  removeCourseFromAcademicConfig,
  sanitizeCourseCatalogItem,
  syncClassToAcademicConfig,
  syncCourseToAcademicConfig,
} from "./pedagogyEntities";

type Row = Record<string, unknown>;

interface SubjectLink {
  subject: string;
  className: string;
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}`;
}

export function getTeacherDisplayName(teacher: Row): string {
  const name = String(teacher.name ?? "").trim();
  const firstName = String(teacher.firstName ?? "").trim();
  if (name && firstName && !normalize(name).includes(normalize(firstName))) {
    return `${firstName} ${name}`.trim();
  }
  return name || firstName || "Enseignant";
}

export function findTeacherByName(teachers: Row[], teacherName: string): Row | undefined {
  const q = normalize(teacherName);
  if (!q) return undefined;
  return teachers.find((teacher) => {
    const display = normalize(getTeacherDisplayName(teacher));
    const raw = normalize(teacher.name);
    const first = normalize(teacher.firstName);
    return display === q || raw === q || first === q || `${first} ${raw}`.trim() === q;
  });
}

/** Liens matière ↔ classe déduits des affectations enregistrées sur l'enseignant. */
export function extractTeacherSubjectLinks(teacher: Row): SubjectLink[] {
  const seen = new Set<string>();
  const links: SubjectLink[] = [];

  const add = (subject: string, className = "") => {
    const value = subject.trim();
    if (!value) return;
    const key = `${normalize(value)}|${normalize(className)}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ subject: value, className: className.trim() });
  };

  if (Array.isArray(teacher.assignments)) {
    for (const entry of teacher.assignments as Row[]) {
      add(String(entry.course ?? entry.subject ?? ""), String(entry.className ?? ""));
    }
  }

  return links;
}

function teacherMatchesReference(teacher: Row, reference: string): boolean {
  const target = String(reference ?? "").trim();
  if (!target) return false;
  return [teacher.id, teacher.publicId].some((value) => String(value ?? "") === target);
}

/** Classes affectées à un enseignant (affectations et responsabilité de classe). */
export function getTeacherAssignedClassNames(
  teacher: Row,
  state?: Pick<BackOfficeState, "assignments" | "classes">,
): string[] {
  const names = new Set<string>();

  if (Array.isArray(teacher.assignedClasses)) {
    for (const name of teacher.assignedClasses as string[]) {
      const value = String(name ?? "").trim();
      if (value) names.add(value);
    }
  }

  for (const link of extractTeacherSubjectLinks(teacher)) {
    if (link.className) names.add(link.className);
  }

  if (state?.assignments) {
    for (const assignment of state.assignments as Row[]) {
      const teacherRef = String(assignment.teacherId ?? "").trim();
      if (!teacherRef || !teacherMatchesReference(teacher, teacherRef)) continue;
      const className = String(assignment.className ?? "").trim();
      if (className) names.add(className);
    }
  }

  if (state?.classes) {
    for (const schoolClass of state.classes as Row[]) {
      const responsible = String(schoolClass.teacherId ?? "").trim();
      if (!responsible || !teacherMatchesReference(teacher, responsible)) continue;
      const className = String(schoolClass.name ?? "").trim();
      if (className) names.add(className);
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b, "fr"));
}

export function formatTeacherClasses(
  teacher: Row,
  state?: Pick<BackOfficeState, "assignments" | "classes">,
): string {
  const list = getTeacherAssignedClassNames(teacher, state);
  return list.length ? list.join(", ") : "—";
}

function applySchoolCode(item: Row, schoolCode?: string): Row {
  if (!schoolCode || schoolCode === "*") return item;
  return { ...item, schoolCode };
}

function upsertAssignment(
  assignments: Row[],
  link: SubjectLink,
  teacherId: string,
  teacherName: string,
  schoolCode?: string,
): Row[] {
  const idx = assignments.findIndex(
    (assignment) =>
      normalize(assignment.subject ?? assignment.course) === normalize(link.subject) &&
      normalize(String(assignment.className ?? "")) === normalize(link.className),
  );

  if (idx >= 0) {
    const existing = assignments[idx];
    const sameTeacher =
      (teacherId && String(existing.teacherId ?? "") === teacherId) ||
      (teacherName && normalize(existing.teacherName) === normalize(teacherName));

    if (
      (String(existing.teacherId ?? "") || String(existing.teacherName ?? "")) &&
      (teacherId || teacherName) &&
      !sameTeacher
    ) {
      return assignments;
    }

    return assignments.map((assignment, index) =>
      index === idx
        ? {
            ...assignment,
            subject: link.subject,
            course: link.subject,
            className: link.className,
            teacherName,
            teacherId,
            schoolCode: schoolCode ?? assignment.schoolCode,
          }
        : assignment,
    );
  }

  return [
    {
      id: newId("ASSIGN"),
      subject: link.subject,
      course: link.subject,
      className: link.className,
      teacherName,
      teacherId,
      schoolCode,
    },
    ...assignments,
  ];
}

function appendTeacherAssignmentLink(teacher: Row, link: SubjectLink): Row {
  if (!link.subject.trim()) return teacher;
  const current = Array.isArray(teacher.assignments) ? [...(teacher.assignments as Row[])] : [];
  const exists = current.some(
    (entry) =>
      normalize(String(entry.course ?? entry.subject ?? "")) === normalize(link.subject) &&
      normalize(String(entry.className ?? "")) === normalize(link.className),
  );
  if (exists) return teacher;
  return {
    ...teacher,
    assignments: [...current, { className: link.className, course: link.subject }],
  };
}

function upsertCourseCatalog(courses: Row[], course: Row, schoolCode?: string): Row[] {
  const sanitized = sanitizeCourseCatalogItem(course);
  const className = String(sanitized.className ?? "").trim();
  const subject = String(sanitized.name ?? "").trim();
  if (!className || !subject) return courses;

  const idx = courses.findIndex(
    (row) =>
      normalize(row.name) === normalize(subject) &&
      normalize(String(row.className ?? "")) === normalize(className),
  );

  if (idx >= 0) {
    return courses.map((row, index) =>
      index === idx
        ? {
            ...sanitizeCourseCatalogItem(row),
            ...sanitized,
            schoolCode: schoolCode ?? row.schoolCode,
          }
        : sanitizeCourseCatalogItem(row),
    );
  }

  return [
    {
      id: String(sanitized.id ?? newId("COURSE")),
      ...sanitized,
      coefficient: sanitized.coefficient ?? 1,
      schoolCode,
    },
    ...courses.map(sanitizeCourseCatalogItem),
  ];
}

/** Enregistrement classe → liste académique (sans toucher matières ni affectations). */
export function syncClassPedagogy(
  state: BackOfficeState,
  schoolClass: Row,
  schoolCode?: string,
  previousName?: string,
): Partial<BackOfficeState> {
  const className = String(schoolClass.name ?? "").trim();
  if (!className) return {};

  return {
    academicConfigs: syncClassToAcademicConfig(state, className, schoolCode, previousName),
  };
}

/** Enregistrement matière → catalogue (courses + subjectsByClass), sans affectation enseignant. */
export function syncCoursePedagogy(
  state: BackOfficeState,
  course: Row,
  schoolCode?: string,
): Partial<BackOfficeState> {
  const scopedCourse = applySchoolCode(sanitizeCourseCatalogItem(course), schoolCode);
  const courses = upsertCourseCatalog((state.courses ?? []) as Row[], scopedCourse, schoolCode);

  return {
    courses,
    academicConfigs: syncCourseToAcademicConfig({ ...state, courses }, scopedCourse, schoolCode),
  };
}

/** Suppression matière → retrait du catalogue académique. */
export function removeCoursePedagogy(
  state: BackOfficeState,
  className: string,
  subject: string,
  schoolCode?: string,
): Partial<BackOfficeState> {
  const targetClass = normalize(className);
  const targetSubject = normalize(subject);

  const courses = ((state.courses ?? []) as Row[]).filter(
    (row) =>
      !(
        normalize(String(row.className ?? "")) === targetClass &&
        normalize(String(row.name ?? "")) === targetSubject
      ),
  );

  return {
    courses,
    academicConfigs: removeCourseFromAcademicConfig(state, className, subject, schoolCode),
  };
}

/** Enregistrement enseignant → affectations uniquement (pas de catalogue matières). */
export function syncTeacherPedagogy(
  state: BackOfficeState,
  teacher: Row,
  schoolCode?: string,
): { assignments: Row[]; teacher: Row } {
  const scopedTeacher = applySchoolCode(teacher, schoolCode);
  const links = extractTeacherSubjectLinks(scopedTeacher);
  const teacherId = String(scopedTeacher.id ?? "");
  const teacherName = getTeacherDisplayName(scopedTeacher);

  let assignments = [...((state.assignments ?? []) as Row[])];

  const teacherAssignments = links.map((link) => ({
    className: link.className,
    course: link.subject,
  }));

  const enrichedTeacher: Row = {
    ...scopedTeacher,
    assignments: teacherAssignments,
    assignedClasses: [...new Set(links.map((link) => link.className).filter(Boolean))],
  };

  for (const link of links) {
    assignments = upsertAssignment(assignments, link, teacherId, teacherName, schoolCode);
  }

  return { assignments, teacher: enrichedTeacher };
}

/** Enregistrement affectation → lien enseignant uniquement (pas de catalogue matières). */
export function syncAssignmentPedagogy(
  state: BackOfficeState,
  assignment: Row,
  schoolCode?: string,
): { assignments: Row[]; teachers: Row[] } {
  const scopedAssignment = applySchoolCode(assignment, schoolCode);
  const subject = String(scopedAssignment.subject ?? scopedAssignment.course ?? "").trim();
  const className = String(scopedAssignment.className ?? "").trim();
  const teacherName = String(scopedAssignment.teacherName ?? "").trim();
  const teacherId = String(scopedAssignment.teacherId ?? "");

  let assignments = [...((state.assignments ?? []) as Row[])];
  let teachers = [...((state.teachers ?? []) as Row[])];

  if (!subject || !className) {
    return { assignments, teachers };
  }

  const teacher =
    (teacherId ? teachers.find((row) => String(row.id) === teacherId) : undefined) ??
    (teacherName ? findTeacherByName(teachers, teacherName) : undefined);
  const resolvedTeacherId = String(teacher?.id ?? teacherId);
  const resolvedTeacherName = teacher ? getTeacherDisplayName(teacher) : teacherName;
  const link: SubjectLink = { subject, className };

  if (resolvedTeacherName || resolvedTeacherId) {
    assignments = upsertAssignment(
      assignments,
      link,
      resolvedTeacherId,
      resolvedTeacherName,
      schoolCode,
    );
    const idx = assignments.findIndex(
      (row) =>
        normalize(row.subject ?? row.course) === normalize(subject) &&
        normalize(String(row.className ?? "")) === normalize(className),
    );
    if (idx >= 0) {
      assignments[idx] = {
        ...assignments[idx],
        ...scopedAssignment,
        subject,
        course: subject,
        teacherId: resolvedTeacherId,
        teacherName: resolvedTeacherName,
      };
    }
  }

  if (teacher) {
    const synced = syncTeacherPedagogy(
      { ...state, assignments, teachers },
      appendTeacherAssignmentLink(teacher, link),
      schoolCode,
    );
    teachers = teachers.map((row) => (String(row.id) === String(teacher.id) ? synced.teacher : row));
    assignments = synced.assignments;
  }

  return { assignments, teachers };
}
