import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Announcement,
  AcademicManagementConfig,
  CountryProfile,
  Course,
  NoteItem,
  PaymentItem,
  PaymentStatus,
  PresenceItem,
  SchoolClass,
  SchoolMessage,
  SchoolProfile,
  Student,
  SubscriptionItem,
  Teacher,
  TeacherAssignment,
  UserAccount,
} from "../data/catalog";
import { getAcademicConfig, getBackOfficeState, getClasses, getCourses, getNotes, getPresences, getStudents, saveBackOfficeState, BackOfficeStatePayload } from "../services/api";
import { useAuth } from "./AuthContext";

export type AdminEntity =
  | "students"
  | "teachers"
  | "classes"
  | "countries"
  | "courses"
  | "assignments"
  | "payments"
  | "subscriptions"
  | "paymentStatuses"
  | "schools"
  | "users"
  | "announcements"
  | "messages";

type ScopedEntity = AdminEntity | "presences" | "notes";

type AdminDataContextValue = {
  studentsData: Student[];
  teachersData: Teacher[];
  classesData: SchoolClass[];
  countriesData: CountryProfile[];
  coursesData: Course[];
  assignmentsData: TeacherAssignment[];
  paymentsData: PaymentItem[];
  subscriptionsData: SubscriptionItem[];
  paymentStatusesData: PaymentStatus[];
  presencesData: PresenceItem[];
  notesData: NoteItem[];
  schoolsData: SchoolProfile[];
  usersData: UserAccount[];
  announcementsData: Announcement[];
  messagesData: SchoolMessage[];
  rolePermissionsData: Record<string, string[]>;
  academicConfigData: AcademicManagementConfig;
  syncStatus: "idle" | "syncing" | "synced" | "offline";
  getItems: (entity: AdminEntity) => any[];
  createItem: (entity: AdminEntity, item: any) => void;
  updateItem: (entity: AdminEntity, item: any) => void;
  deleteItem: (entity: AdminEntity, id: string) => void;
  upsertPresenceItems: (items: PresenceItem[]) => void;
  upsertNoteItem: (item: NoteItem) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

const emptyAcademicConfig: AcademicManagementConfig = {
  schoolCode: "",
  periodMode: "trimestre",
  periods: [],
  evaluationTypes: [],
  defaultScale: 20,
  reportCardMode: "period",
};

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useAuth();
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [teachersData, setTeachersData] = useState<Teacher[]>([]);
  const [classesData, setClassesData] = useState<SchoolClass[]>([]);
  const [countriesData, setCountriesData] = useState<CountryProfile[]>([]);
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [assignmentsData, setAssignmentsData] = useState<TeacherAssignment[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [paymentStatusesData, setPaymentStatusesData] = useState<PaymentStatus[]>([]);
  const [presencesData, setPresencesData] = useState<PresenceItem[]>([]);
  const [notesData, setNotesData] = useState<NoteItem[]>([]);
  const [schoolsData, setSchoolsData] = useState<SchoolProfile[]>([]);
  const [usersData, setUsersData] = useState<UserAccount[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>([]);
  const [messagesData, setMessagesData] = useState<SchoolMessage[]>([]);
  const [rolePermissionsData, setRolePermissionsData] = useState<Record<string, string[]>>({});
  const [academicConfigData, setAcademicConfigData] = useState<AcademicManagementConfig>(emptyAcademicConfig);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "offline">("idle");

  const stateSnapshot = useMemo(
    () => ({
      students: studentsData,
      teachers: teachersData,
      classes: classesData,
      countries: countriesData,
      courses: coursesData,
      assignments: assignmentsData,
      payments: paymentsData,
      subscriptions: subscriptionsData,
      paymentStatuses: paymentStatusesData,
      presences: presencesData,
      notes: notesData,
      schools: schoolsData,
      users: usersData,
      announcements: announcementsData,
      messages: messagesData,
      rolePermissions: rolePermissionsData,
      academicConfigs: { [academicConfigData.schoolCode]: academicConfigData },
    }),
    [
      announcementsData,
      assignmentsData,
      classesData,
      countriesData,
      coursesData,
      messagesData,
      notesData,
      paymentsData,
      paymentStatusesData,
      presencesData,
      schoolsData,
      studentsData,
      subscriptionsData,
      teachersData,
      usersData,
      rolePermissionsData,
      academicConfigData,
    ]
  );
  const scopedStateSnapshot = useMemo(
    () => scopeBackOfficePayload(stateSnapshot, session),
    [session, stateSnapshot]
  );

  useEffect(() => {
    if (!canSyncBackOfficeState(session?.role, session?.accessToken)) {
      return;
    }

    let mounted = true;
    setSyncStatus("syncing");

    const refresh = () => getBackOfficeState()
      .then((payload) => {
        if (!mounted) return;
        applySyncedState(payload);
        setSyncStatus("synced");
      })
      .catch(() => {
        if (!mounted) return;
        setSyncStatus("offline");
      });
    refresh();
    const intervalId = setInterval(refresh, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [session?.accessToken, session?.role]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    if (canSyncBackOfficeState(session.role, session.accessToken)) {
      return;
    }

    let mounted = true;
    const refresh = () => Promise.all([getStudents(), getClasses(), getCourses(), getNotes(), getPresences(), getAcademicConfig()])
      .then(([studentPayload, classPayload, coursePayload, notePayload, presencePayload, academicConfigPayload]) => {
        if (mounted) {
          applyArray(studentPayload, setStudentsData);
          applyArray(classPayload, setClassesData);
          applyArray(coursePayload, setCoursesData);
          applyArray(notePayload, setNotesData);
          applyArray(presencePayload, setPresencesData);
          setAcademicConfigData(academicConfigPayload as AcademicManagementConfig);
          setSyncStatus("synced");
        }
      })
      .catch(() => {
        if (mounted) setSyncStatus("offline");
      });
    refresh();
    const intervalId = setInterval(refresh, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [session?.accessToken]);

  const applySyncedState = (payload: BackOfficeStatePayload) => {
    const scopedPayload = scopeBackOfficePayload(payload, session);
    applyArray(scopedPayload.students, setStudentsData);
    applyArray(scopedPayload.teachers, setTeachersData);
    applyArray(scopedPayload.classes, setClassesData);
    applyArray(scopedPayload.countries, setCountriesData);
    applyArray(scopedPayload.courses, setCoursesData);
    applyArray(scopedPayload.assignments, setAssignmentsData);
    applyArray(scopedPayload.payments, setPaymentsData);
    applyArray(scopedPayload.subscriptions, setSubscriptionsData);
    applyArray(scopedPayload.paymentStatuses, setPaymentStatusesData);
    applyArray(scopedPayload.presences, setPresencesData);
    applyArray(scopedPayload.notes, setNotesData);
    applyArray(scopedPayload.schools, setSchoolsData);
    applyArray(scopedPayload.users, setUsersData);
    applyArray(scopedPayload.announcements, setAnnouncementsData);
    applyArray(scopedPayload.messages, setMessagesData);
    if (payload.rolePermissions && typeof payload.rolePermissions === "object") {
      setRolePermissionsData(payload.rolePermissions);
    }
    if (scopedPayload.academicConfigs && typeof scopedPayload.academicConfigs === "object") {
      const configs = scopedPayload.academicConfigs as Record<string, AcademicManagementConfig>;
      const firstConfig = Object.values(configs)[0];
      if (firstConfig) {
        setAcademicConfigData(firstConfig);
      }
    }
  };

  useEffect(() => {
    if (!session) {
      return;
    }

    const roleLabel = roleLabelFromSession(session.role);
    const permissions = roleLabel ? rolePermissionsData[roleLabel] : undefined;
    if (!permissions?.length) {
      return;
    }

    const currentPermissions = session.permissions ?? session.user.permissions ?? [];
    if (sameStringSet(currentPermissions, permissions)) {
      return;
    }

    setSession({
      ...session,
      permissions,
      user: {
        ...session.user,
        permissions,
      },
    });
  }, [rolePermissionsData, session, setSession]);

  const persistSyncedState = (nextState: BackOfficeStatePayload) => {
    if (!canSyncBackOfficeState(session?.role, session?.accessToken)) {
      return;
    }

    setSyncStatus("syncing");
    saveBackOfficeState(nextState)
      .then(() => setSyncStatus("synced"))
      .catch(() => setSyncStatus("offline"));
  };

  const value = useMemo<AdminDataContextValue>(() => {
    const state = scopedStateSnapshot;

    const setters = {
      students: setStudentsData,
      teachers: setTeachersData,
      classes: setClassesData,
      countries: setCountriesData,
      courses: setCoursesData,
      assignments: setAssignmentsData,
      payments: setPaymentsData,
      subscriptions: setSubscriptionsData,
      paymentStatuses: setPaymentStatusesData,
      schools: setSchoolsData,
      users: setUsersData,
      announcements: setAnnouncementsData,
      messages: setMessagesData,
    };

    const commitEntity = (entity: AdminEntity, updater: (items: any[]) => any[]) => {
      setters[entity]((items: any[]) => {
        const nextItems = enforceEntityScope(entity, updater(items), session, state);
        persistSyncedState({ ...state, [entity]: nextItems });
        return nextItems;
      });
    };

    return {
      studentsData: (state.students ?? []) as Student[],
      teachersData: (state.teachers ?? []) as Teacher[],
      classesData: (state.classes ?? []) as SchoolClass[],
      countriesData: (state.countries ?? []) as CountryProfile[],
      coursesData: (state.courses ?? []) as Course[],
      assignmentsData: (state.assignments ?? []) as TeacherAssignment[],
      paymentsData: (state.payments ?? []) as PaymentItem[],
      subscriptionsData: (state.subscriptions ?? []) as SubscriptionItem[],
      paymentStatusesData: (state.paymentStatuses ?? []) as PaymentStatus[],
      presencesData: (state.presences ?? []) as PresenceItem[],
      notesData: (state.notes ?? []) as NoteItem[],
      schoolsData: (state.schools ?? []) as SchoolProfile[],
      usersData: (state.users ?? []) as UserAccount[],
      announcementsData: (state.announcements ?? []) as Announcement[],
      messagesData: (state.messages ?? []) as SchoolMessage[],
      rolePermissionsData,
      academicConfigData,
      syncStatus,
      getItems: (entity) => state[entity],
      createItem: (entity, item) => commitEntity(entity, (items) => [applyItemScope(entity, item, session, state), ...items]),
      updateItem: (entity, item) =>
        commitEntity(entity, (items) => items.map((row) => (row.id === item.id ? applyItemScope(entity, item, session, state) : row))),
      deleteItem: (entity, id) =>
        commitEntity(entity, (items) => items.filter((row) => row.id !== id)),
      upsertPresenceItems: (items) =>
        setPresencesData((current) => {
          const scopedItems = items.map((item) => applyItemScope("presences", item, session, state));
          const keys = new Set(scopedItems.map((item) => `${item.studentId}-${item.date}`));
          const nextItems = enforceEntityScope(
            "presences",
            [...scopedItems, ...current.filter((item) => !keys.has(`${item.studentId}-${item.date}`))],
            session,
            state
          );
          persistSyncedState({ ...state, presences: nextItems });
          return nextItems;
        }),
      upsertNoteItem: (item) =>
        setNotesData((current) => {
          const scopedItem = applyItemScope("notes", item, session, state);
          const exists = current.some((row) => row.id === scopedItem.id);
          const nextItems = enforceEntityScope(
            "notes",
            exists ? current.map((row) => (row.id === scopedItem.id ? scopedItem : row)) : [scopedItem, ...current],
            session,
            state
          );
          persistSyncedState({ ...state, notes: nextItems });
          return nextItems;
        }),
    };
  }, [
    announcementsData,
    academicConfigData,
    assignmentsData,
    classesData,
    countriesData,
    coursesData,
    messagesData,
    notesData,
    paymentsData,
    subscriptionsData,
    paymentStatusesData,
    presencesData,
    schoolsData,
    studentsData,
    teachersData,
    usersData,
    rolePermissionsData,
    session?.accessToken,
    session?.role,
    session?.school.code,
    session?.user.schoolCode,
    scopedStateSnapshot,
    stateSnapshot,
    syncStatus,
  ]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

function canSyncBackOfficeState(role?: string, accessToken?: string) {
  return Boolean(accessToken) && ["super_admin", "country_admin", "school_admin"].includes(role ?? "");
}

function applyArray<T>(value: unknown, setter: React.Dispatch<React.SetStateAction<T[]>>) {
  if (Array.isArray(value)) {
    setter(value as T[]);
  }
}

function scopeBackOfficePayload<T extends BackOfficeStatePayload>(payload: T, session: any): T {
  if (!session || session.role === "super_admin") {
    return payload;
  }

  const schoolCode = getSessionSchoolCode(session);
  if (!schoolCode || session.role === "country_admin") {
    return payload;
  }

  const students = filterBySchool(payload.students, schoolCode) as Student[];
  const studentIds = new Set(students.map((item) => item.id));
  const classNames = new Set(students.map((item) => item.className).filter(Boolean));
  const classes = filterRows(payload.classes, (item) => rowInSchool(item, schoolCode) || classNames.has(item.name)) as SchoolClass[];
  classes.forEach((item) => item.name && classNames.add(item.name));
  const teachers = filterRows(payload.teachers, (item) =>
    rowInSchool(item, schoolCode) ||
    (item.assignedClasses ?? []).some((className: string) => classNames.has(className)) ||
    (item.assignments ?? []).some((assignment: TeacherAssignment) => classNames.has(assignment.className))
  ) as Teacher[];
  const teacherIds = new Set(teachers.map((item) => item.id));

  return {
    ...payload,
    schools: filterRows(payload.schools, (item) => item.code === schoolCode),
    users: filterRows(payload.users, (item) => item.schoolCode === schoolCode),
    students,
    teachers,
    classes,
    courses: filterRows(payload.courses, (item) => rowInSchool(item, schoolCode) || classNames.has(item.className)),
    assignments: filterRows(payload.assignments, (item) =>
      rowInSchool(item, schoolCode) || classNames.has(item.className) || teacherIds.has(item.teacherId)
    ),
    payments: filterRows(payload.payments, (item) => rowInSchool(item, schoolCode) || studentIds.has(item.studentId)),
    paymentStatuses: filterRows(payload.paymentStatuses, (item) => rowInSchool(item, schoolCode)),
    subscriptions: filterRows(payload.subscriptions, (item) => item.schoolCode === schoolCode),
    presences: filterRows(payload.presences, (item) => rowInSchool(item, schoolCode) || studentIds.has(item.studentId)),
    notes: filterRows(payload.notes, (item) => rowInSchool(item, schoolCode) || studentIds.has(item.studentId)),
    announcements: filterRows(payload.announcements, (item) => rowInSchool(item, schoolCode)),
    messages: filterRows(payload.messages, (item) => rowInSchool(item, schoolCode) || studentIds.has(item.studentId)),
    academicConfigs: filterAcademicConfigs(payload.academicConfigs, schoolCode),
  };
}

function getSessionSchoolCode(session: any) {
  return String(session?.user?.schoolCode && session.user.schoolCode !== "*" ? session.user.schoolCode : session?.school?.code ?? "")
    .trim()
    .toUpperCase();
}

function filterBySchool(value: unknown, schoolCode: string) {
  return filterRows(value, (item) => rowInSchool(item, schoolCode));
}

function applyItemScope(entity: ScopedEntity, item: any, session: any, state: BackOfficeStatePayload) {
  if (!item || session?.role !== "school_admin") {
    return item;
  }

  const schoolCode = getSessionSchoolCode(session);
  if (!schoolCode) {
    return item;
  }

  if (entity === "schools" || entity === "subscriptions" || entity === "countries") {
    return item;
  }

  const scopedItem = { ...item };
  if (entityNeedsSchoolCode(entity)) {
    scopedItem.schoolCode = schoolCode;
  }

  if (entity === "payments" || entity === "messages" || entity === "presences" || entity === "notes") {
    const student = findStudentForScopedItem(scopedItem, state) as any;
    if (student?.schoolCode) {
      scopedItem.schoolCode = student.schoolCode;
    }
  }

  if (entity === "announcements") {
    scopedItem.schoolCode = schoolCode;
  }

  return scopedItem;
}

function enforceEntityScope(entity: ScopedEntity, items: any[], session: any, state: BackOfficeStatePayload) {
  if (session?.role !== "school_admin") {
    return items;
  }

  const schoolCode = getSessionSchoolCode(session);
  if (!schoolCode) {
    return [];
  }

  const scopedItems = items.map((item) => applyItemScope(entity, item, session, state));
  return scopedItems.filter((item) => itemBelongsToSchool(entity, item, schoolCode, state));
}

function entityNeedsSchoolCode(entity: ScopedEntity) {
  return ["students", "teachers", "classes", "courses", "assignments", "payments", "paymentStatuses", "users", "announcements", "messages", "presences", "notes"].includes(entity);
}

function itemBelongsToSchool(entity: ScopedEntity, item: any, schoolCode: string, state: BackOfficeStatePayload) {
  if (!item) return false;
  if (entity === "schools") return item.code === schoolCode;

  if (entity === "payments" || entity === "presences" || entity === "notes") {
    const student = findStudentForScopedItem(item, state) as any;
    return Boolean(student) && student.schoolCode === schoolCode;
  }

  if (entity === "messages" && item.studentId) {
    const student = findStudentForScopedItem(item, state) as any;
    return Boolean(student) && student.schoolCode === schoolCode;
  }

  if (rowInSchool(item, schoolCode)) return true;

  if (entity === "assignments") {
    const classes = Array.isArray(state.classes) ? state.classes : [];
    const teachers = Array.isArray(state.teachers) ? state.teachers : [];
    const matchingClass = classes.find((schoolClass: any) => schoolClass.name === item.className);
    const matchingTeacher = teachers.find((teacher: any) => teacher.id === item.teacherId || teacher.publicId === item.teacherId);
    return (!matchingClass || rowInSchool(matchingClass, schoolCode)) && (!matchingTeacher || rowInSchool(matchingTeacher, schoolCode));
  }

  return true;
}

function findStudentForScopedItem(item: any, state: BackOfficeStatePayload) {
  const students = Array.isArray(state.students) ? state.students : [];
  return students.find((student: any) => student.id === item.studentId || student.publicId === item.studentId || student.matricule === item.studentId);
}

function filterRows(value: unknown, predicate: (item: any) => boolean) {
  return Array.isArray(value) ? value.filter((item) => predicate(item ?? {})) : [];
}

function rowInSchool(item: any, schoolCode: string) {
  return item?.schoolCode === schoolCode || item?.code === schoolCode || item?.publicId === schoolCode;
}

function filterAcademicConfigs(value: unknown, schoolCode: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const config = (value as Record<string, AcademicManagementConfig>)[schoolCode];
  return config ? { [schoolCode]: config } : {};
}

function roleLabelFromSession(role?: string) {
  if (role === "super_admin") return "Super Administrateur OKAFRIK";
  if (role === "country_admin") return "Admin Pays";
  if (role === "school_admin") return "Admin School";
  if (role === "principal" || role === "prefet") return "Préfet des études";
  if (role === "secretary") return "Secrétaire";
  if (role === "teacher") return "Enseignant";
  if (role === "parent_student") return "Parent";
  if (role === "student") return "Élève / Étudiant";
  return undefined;
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const values = new Set(left);
  return right.every((item) => values.has(item));
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData doit etre utilise dans AdminDataProvider");
  }

  return context;
}
