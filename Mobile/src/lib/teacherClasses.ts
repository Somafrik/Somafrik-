type Row = Record<string, unknown>;

function teacherMatchesReference(teacher: Row, reference: string): boolean {
  const target = String(reference ?? "").trim();
  if (!target) return false;
  return [teacher.id, teacher.publicId].some((value) => String(value ?? "") === target);
}

function extractAssignmentClassNames(teacher: Row): string[] {
  const names = new Set<string>();
  const assignedClass = String(teacher.assignedClass ?? "").trim();
  if (assignedClass) names.add(assignedClass);

  if (Array.isArray(teacher.assignedClasses)) {
    for (const name of teacher.assignedClasses as string[]) {
      const value = String(name ?? "").trim();
      if (value) names.add(value);
    }
  }

  if (Array.isArray(teacher.assignments)) {
    for (const entry of teacher.assignments as Row[]) {
      const className = String(entry.className ?? "").trim();
      if (className) names.add(className);
    }
  }

  return [...names];
}

export function getTeacherAssignedClassNames(
  teacher: Row,
  state?: { assignments?: Row[]; classes?: Row[] },
): string[] {
  const names = new Set(extractAssignmentClassNames(teacher));

  if (state?.assignments) {
    for (const assignment of state.assignments) {
      const teacherRef = String(assignment.teacherId ?? "").trim();
      if (!teacherRef || !teacherMatchesReference(teacher, teacherRef)) continue;
      const className = String(assignment.className ?? "").trim();
      if (className) names.add(className);
    }
  }

  if (state?.classes) {
    for (const schoolClass of state.classes) {
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
  state?: { assignments?: Row[]; classes?: Row[] },
): string {
  const list = getTeacherAssignedClassNames(teacher, state);
  return list.length ? list.join(", ") : "Aucune classe";
}
