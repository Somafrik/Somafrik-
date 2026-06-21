type Row = Record<string, unknown>;

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizeClassName(value: unknown) {
  return normalize(String(value ?? ""));
}

function scopedSchoolStudents(state: Record<string, unknown>, schoolCode?: string): Row[] {
  const rows = (state.students ?? []) as Row[];
  if (!schoolCode || schoolCode === "*") return rows;
  return rows.filter((row) => normalize(row.schoolCode) === normalize(schoolCode));
}

function classBelongsToSchool(item: Row, schoolCode: string | undefined, className: string): boolean {
  const target = normalizeClassName(className);
  if (normalizeClassName(item.name) !== target) return false;
  if (!schoolCode || schoolCode === "*") return true;
  const itemSchool = normalize(item.schoolCode ?? "");
  return !itemSchool || itemSchool === normalize(schoolCode);
}

export function validateClassDeletion(
  className: string,
  state: Record<string, unknown>,
  schoolCode?: string,
): string | null {
  const target = normalizeClassName(className);
  if (!target) return "Le nom de la classe est requis.";

  const enrolled = scopedSchoolStudents(state, schoolCode).filter(
    (student) => normalizeClassName(student.className) === target,
  );
  if (enrolled.length) {
    return `Suppression refusée : ${enrolled.length} élève(s) encore inscrit(s) dans cette classe.`;
  }

  const courses = ((state.courses ?? []) as Row[]).filter(
    (course) => normalizeClassName(course.className) === target,
  );
  if (courses.length) {
    return `Suppression refusée : ${courses.length} cours lié(s) à cette classe.`;
  }

  const assignments = ((state.assignments ?? []) as Row[]).filter(
    (assignment) => normalizeClassName(assignment.className) === target,
  );
  if (assignments.length) {
    return `Suppression refusée : ${assignments.length} affectation(s) liée(s) à cette classe.`;
  }

  return null;
}

export function removeSchoolClassFromState(
  state: Record<string, unknown>,
  row: Row,
  schoolCode?: string,
): { ok: true; patch: Record<string, unknown> } | { ok: false; error: string } {
  const className = String(row.name ?? "").trim();
  const error = validateClassDeletion(className, state, schoolCode);
  if (error) return { ok: false, error };

  const currentClasses = (state.classes ?? []) as Row[];
  const nextClasses = currentClasses.filter((item) => !classBelongsToSchool(item, schoolCode, className));

  if (nextClasses.length === currentClasses.length) {
    return {
      ok: false,
      error:
        "Suppression refusée : cette classe n'existe que via la configuration ou des données liées. Retirez d'abord les dépendances.",
    };
  }

  const patch: Record<string, unknown> = { classes: nextClasses };

  if (schoolCode && schoolCode !== "*") {
    const academicConfigs = { ...((state.academicConfigs as Record<string, unknown>) ?? {}) };
    const currentConfig = { ...((academicConfigs[schoolCode] as Record<string, unknown>) ?? {}) };
    if (Array.isArray(currentConfig.classNames)) {
      currentConfig.classNames = (currentConfig.classNames as string[]).filter(
        (name) => normalizeClassName(name) !== normalizeClassName(className),
      );
    }
    patch.academicConfigs = {
      ...academicConfigs,
      [schoolCode]: currentConfig,
    };
  }

  return { ok: true, patch };
}
