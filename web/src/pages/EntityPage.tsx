import { useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Card, SectionHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, type Column } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Field";
import { useToast } from "../components/ui/Toast";
import { hasBackOfficePermission } from "../lib/permissions";
import { usePermissionContext } from "../lib/usePermissionContext";
import {
  applySchoolScopeToItem,
  deleteScopedEntityRow,
  getEntityModule,
  getScopedEntityRows,
  mergeScopedEntityRows,
  type SchoolEntityKey,
} from "../lib/entityModules";
import {
  getAssignmentSelectOptions,
  normalizeAssignmentForm,
  prepareAssignmentForSave,
  validateAssignmentConflict,
} from "../lib/assignments";
import {
  getCurrentSchool,
  scopedClasses,
  scopedCourses,
  scopedStudents,
  scopedTeachers,
} from "../lib/establishment";
import {
  syncAssignmentPedagogy,
  syncCoursePedagogy,
  syncTeacherPedagogy,
} from "../lib/pedagogySync";
import type { BackOfficeState, SessionUser } from "../types";
import { getSchoolAcademicLists, getSubjectsForClass, mergeSelectOptions } from "../lib/academicConfig";
import {
  generateTeacherIdentifiers,
  getTeacherLoginIdentifier,
  resolveTeacherIdentifiers,
} from "../lib/entityIdentifiers";
import {
  filterSchoolClassRecords,
  getAvailableClassNameOptions,
  removeSchoolClassFromState,
  validateUniqueClassName,
} from "../lib/classRules";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}`;
}

const STUDENT_LINKED_KEYS = new Set<SchoolEntityKey>([
  "payments",
  "presences",
  "notes",
  "messages",
  "bulletins",
  "documents",
]);

function linkStudentFromName(
  key: SchoolEntityKey,
  item: Record<string, unknown>,
  user: SessionUser | null,
  state: BackOfficeState,
): Record<string, unknown> {
  if (!STUDENT_LINKED_KEYS.has(key) || item.studentId) return item;
  const studentName = String(item.studentName ?? "").trim().toLowerCase();
  if (!studentName) return item;
  const student = scopedStudents(user, state).find(
    (row) => String(row.name ?? "").trim().toLowerCase() === studentName,
  );
  if (!student?.id) return item;
  return {
    ...item,
    studentId: student.id,
    className: item.className ?? student.className,
  };
}

interface EntityPageProps {
  entity: SchoolEntityKey;
}

export function EntityPage({ entity }: EntityPageProps) {
  const module = getEntityModule(entity);
  const { session } = useAuth();
  const { state, update } = useData();
  const ctx = usePermissionContext();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const canRead = module ? hasBackOfficePermission(ctx, module.feature, "READ") : false;
  const canCreate = module ? hasBackOfficePermission(ctx, module.feature, "CREATE") : false;
  const canUpdate = module ? hasBackOfficePermission(ctx, module.feature, "UPDATE") : false;
  const canDelete = module ? hasBackOfficePermission(ctx, module.feature, "DELETE") : false;
  const schoolCode = session?.user?.schoolCode;
  const academicLists = useMemo(
    () => getSchoolAcademicLists(state, schoolCode),
    [state, schoolCode],
  );
  const assignmentOptions = useMemo(
    () =>
      module?.key === "assignments"
        ? getAssignmentSelectOptions(
            session?.user ?? null,
            state,
            String(editing?.className ?? ""),
            schoolCode,
          )
        : null,
    [module?.key, session?.user, state, editing?.className, schoolCode],
  );

  function getSelectOptionsForField(field: NonNullable<typeof module>["fields"][number]) {
    if (field.selectOptions?.length) {
      return field.selectOptions;
    }
    if (field.optionsKey === "levels") {
      return academicLists.levels.map((option) => ({ value: option, label: option }));
    }
    if (field.optionsKey === "tracks") {
      return academicLists.tracks.map((option) => ({ value: option, label: option }));
    }
    if (field.optionsKey === "classNames") {
      if (module?.key === "classes") {
        const existing = filterSchoolClassRecords(
          (state.classes ?? []) as Record<string, unknown>[],
          schoolCode,
        );
        return getAvailableClassNameOptions(
          academicLists.classNames,
          existing,
          String(editing?.name ?? ""),
        ).map((option) => ({ value: option, label: option }));
      }
      const extra =
        module?.key === "assignments"
          ? (assignmentOptions?.classes ?? []).map((option) => option.value)
          : [];
      return mergeSelectOptions(academicLists.classNames, extra).map((option) => ({
        value: option,
        label: option,
      }));
    }
    if (field.optionsKey === "subjects") {
      const className = String(editing?.className ?? "");
      const classScopedModules = module?.key === "courses" || module?.key === "assignments";
      if (classScopedModules) {
        if (!className) return [];
        const configured = getSubjectsForClass(state, schoolCode, className);
        const extra =
          module?.key === "assignments"
            ? (assignmentOptions?.subjects ?? []).map((option) => option.value)
            : [];
        return mergeSelectOptions(configured, extra).map((option) => ({
          value: option,
          label: option,
        }));
      }
      return academicLists.subjects.map((option) => ({ value: option, label: option }));
    }
    if (field.optionsKey === "teachers") {
      return assignmentOptions?.teachers ?? [];
    }
    if (field.optionsKey === "classes") {
      return assignmentOptions?.classes ?? [];
    }
    if (field.optionsKey === "assignmentSubjects") {
      return assignmentOptions?.subjects ?? [];
    }
    return [];
  }

  const school = getCurrentSchool(session?.user ?? null, state);

  const rows = useMemo(() => {
    if (!module) return [];
    const scoped = getScopedEntityRows(module.key, session?.user ?? null, state);
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((row) =>
      Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q)),
    );
  }, [module, search, session?.user, state]);

  if (!module) {
    return <Navigate to="/etablissement" replace />;
  }

  if (!canRead) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold text-muted">
          Vous n'avez pas l'autorisation de consulter {module.label.toLowerCase()}.
        </p>
      </Card>
    );
  }

  async function persistPatch(patch: Partial<BackOfficeState>, message: string) {
    setBusy(true);
    try {
      await update(patch);
      showToast(message, "success");
    } catch {
      showToast("Échec de la synchronisation", "error");
      throw new Error("sync failed");
    } finally {
      setBusy(false);
    }
  }

  function buildPedagogyPatch(
    key: SchoolEntityKey,
    nextItem: Record<string, unknown>,
    nextEntityRows: Record<string, unknown>[],
  ): Partial<BackOfficeState> {
    const schoolCode = session?.user?.schoolCode;
    const baseState: BackOfficeState = {
      ...state,
      [key]: nextEntityRows,
    };

    if (key === "teachers") {
      const synced = syncTeacherPedagogy(baseState, nextItem, schoolCode);
      return {
        teachers: nextEntityRows.map((row) =>
          String(row.id) === String(synced.teacher.id) ? synced.teacher : row,
        ),
        courses: synced.courses,
        assignments: synced.assignments,
      };
    }

    if (key === "courses") {
      const synced = syncCoursePedagogy(
        { ...baseState, courses: nextEntityRows },
        nextItem,
        schoolCode,
      );
      return {
        courses: synced.courses,
        assignments: synced.assignments,
        teachers: synced.teachers,
      };
    }

    if (key === "assignments") {
      const synced = syncAssignmentPedagogy(
        { ...baseState, assignments: nextEntityRows },
        nextItem,
        schoolCode,
      );
      return {
        assignments: synced.assignments,
        courses: synced.courses,
        teachers: synced.teachers,
      };
    }

    return { [key]: nextEntityRows };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !module) return;

    const schoolCode = session?.user?.schoolCode;
    let workingItem = { ...editing };

    const missingRequired = module.fields.find(
      (field) => field.required && !String(workingItem[field.key] ?? "").trim(),
    );
    if (missingRequired) {
      showToast(`${missingRequired.label} est obligatoire`, "error");
      return;
    }

    if (module.key === "assignments") {
      const teachers = scopedTeachers(session?.user ?? null, state);
      workingItem = prepareAssignmentForSave(workingItem, teachers, schoolCode);
      const scopedAssignments = getScopedEntityRows("assignments", session?.user ?? null, state);
      const conflict = validateAssignmentConflict(
        workingItem,
        scopedAssignments,
        scopedCourses(session?.user ?? null, state),
        scopedClasses(session?.user ?? null, state),
        teachers,
        editing.id ? String(editing.id) : undefined,
        state,
        schoolCode,
      );
      if (conflict) {
        showToast(conflict, "error");
        return;
      }
    }

    if (module.key === "classes") {
      const classConflict = validateUniqueClassName(
        String(workingItem.name ?? ""),
        filterSchoolClassRecords((state.classes ?? []) as Record<string, unknown>[], schoolCode),
        editing.id ? String(editing.id) : undefined,
      );
      if (classConflict) {
        showToast(classConflict, "error");
        return;
      }
    }

    const scopedItem = applySchoolScopeToItem(module.key, workingItem, schoolCode, state);
    const linkedItem = linkStudentFromName(module.key, scopedItem, session?.user ?? null, state);
    const current = getScopedEntityRows(module.key, session?.user ?? null, state);
    const exists = Boolean(linkedItem.id) && current.some((row) => row.id === linkedItem.id);

    let preparedItem = { ...linkedItem };

    if (module.key === "teachers") {
      const code = String(schoolCode ?? preparedItem.schoolCode ?? "").trim();
      if (!code || code === "*") {
        showToast("Code établissement requis pour générer l'identifiant enseignant", "error");
        return;
      }
      preparedItem = {
        ...preparedItem,
        ...resolveTeacherIdentifiers(
          preparedItem,
          code,
          (state.teachers ?? []) as Record<string, unknown>[],
        ),
      };
    }

    const nextItem = exists
      ? preparedItem
      : (() => {
          const id = String(preparedItem.id ?? newId(module.key.toUpperCase()));
          return {
            ...preparedItem,
            id,
            ...(module.key === "students"
              ? {
                  matricule: preparedItem.matricule ?? preparedItem.publicId ?? id,
                  archived: preparedItem.archived ?? false,
                }
              : {}),
          };
        })();

    const nextAllRows = mergeScopedEntityRows(module.key, session?.user ?? null, state, nextItem);
    const patch = buildPedagogyPatch(module.key, nextItem, nextAllRows);

    try {
      await persistPatch(patch, exists ? `${module.label} modifié` : `${module.label} créé`);
      setEditing(null);
    } catch {
      /* toast déjà affiché */
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!module || !row.id) return;
    if (!window.confirm(`Supprimer cet élément de ${module.label.toLowerCase()} ?`)) return;

    if (module.key === "classes") {
      const result = removeSchoolClassFromState(state, row, schoolCode);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      try {
        await persistPatch(result.patch, "Classe supprimée");
      } catch {
        /* toast déjà affiché */
      }
      return;
    }

    const nextAllRows = deleteScopedEntityRow(
      module.key,
      session?.user ?? null,
      state,
      String(row.id),
    );
    if (nextAllRows.length === ((state[module.key] ?? []) as unknown[]).length) {
      showToast("Suppression refusée : élément hors périmètre ou introuvable.", "error");
      return;
    }
    try {
      await persistPatch({ [module.key]: nextAllRows }, "Élément supprimé");
    } catch {
      /* toast déjà affiché */
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    ...module.columns.map((key) => ({
      key,
      header: module.columnLabels?.[key] ?? module.fields.find((field) => field.key === key)?.label ?? key,
      render: (row: Record<string, unknown>) => {
        if (module.key === "teachers" && key === "publicId") {
          const publicId = String(row.publicId ?? "").trim();
          if (!publicId) return "—";
          return `${publicId} · connexion : ${getTeacherLoginIdentifier(publicId)}`;
        }
        return String(row[key] ?? "—");
      },
    })),
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          {canUpdate ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next =
                  module.key === "assignments"
                    ? normalizeAssignmentForm(
                        { ...row },
                        scopedTeachers(session?.user ?? null, state),
                      )
                    : { ...row };
                setEditing(next);
              }}
            >
              Modifier
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="danger" size="sm" disabled={busy} onClick={() => void handleDelete(row)}>
              Supprimer
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <Card className="p-6">
        <SectionHeader
          title={module.label}
          description={
            school
              ? `${module.description} · Périmètre : ${school.name} (${school.code})`
              : module.description
          }
          actions={
            canCreate ? (
              <Button
                size="sm"
                onClick={() => {
                  if (module.key === "assignments") {
                    setEditing({ className: "", subject: "", teacherId: "" });
                    return;
                  }
                  if (module.key === "courses") {
                    setEditing({ className: "", name: "" });
                    return;
                  }
                  if (module.key === "teachers") {
                    const code = session?.user?.schoolCode;
                    if (!code || code === "*") {
                      showToast("Code établissement requis pour générer l'identifiant", "error");
                      return;
                    }
                    setEditing(
                      generateTeacherIdentifiers(code, (state.teachers ?? []) as Record<string, unknown>[]),
                    );
                    return;
                  }
                  setEditing({});
                }}
              >
                Ajouter
              </Button>
            ) : null
          }
        />
        <div className="mt-4">
          <Input
            placeholder={`Rechercher dans ${module.label.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row, index) => String(row.id ?? index)}
          />
        </div>
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={
          editing?.id
            ? `Modifier — ${module.label}`
            : `Nouveau — ${module.label}`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button form={`entity-form-${entity}`} type="submit" disabled={busy || (!canCreate && !canUpdate)}>
              Enregistrer
            </Button>
          </>
        }
      >
        {editing ? (
          <form id={`entity-form-${entity}`} onSubmit={handleSubmit} className="grid gap-4">
            {module.fields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={field.key} hint={field.hint}>
                {field.inputType === "select" ? (
                  <Select
                    id={field.key}
                    value={String(editing[field.key] ?? "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        (module.key === "assignments" || module.key === "courses") &&
                        field.key === "className"
                      ) {
                        setEditing({
                          ...editing,
                          className: value,
                          ...(module.key === "assignments" ? { subject: "" } : { name: "" }),
                        });
                        return;
                      }
                      setEditing({ ...editing, [field.key]: value });
                    }}
                    options={[
                      { value: "", label: field.placeholder ?? "Choisir…" },
                      ...getSelectOptionsForField(field),
                    ]}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={String(editing[field.key] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    readOnly={field.readOnly}
                    onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value })}
                  />
                )}
              </Field>
            ))}
            {(module.key === "assignments" || module.key === "courses") &&
            !String(editing.className ?? "") ? (
              <p className="text-xs text-muted">
                Sélectionnez d'abord une classe pour voir les matières disponibles.
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </>
  );
}
