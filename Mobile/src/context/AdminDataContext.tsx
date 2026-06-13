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
  announcements,
  classes,
  countries,
  courses,
  defaultAcademicConfig,
  notes,
  payments,
  paymentStatuses,
  presences,
  schools,
  schoolMessages,
  students,
  subscriptions,
  teacherAssignments,
  teachers,
  userAccounts,
  rolePermissions as initialRolePermissions,
} from "../data/catalog";
import { getAcademicConfig, getBackOfficeState, getClasses, getCourses, getNotes, getStudents, saveBackOfficeState, BackOfficeStatePayload } from "../services/api";
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

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useAuth();
  const [studentsData, setStudentsData] = useState<Student[]>(students);
  const [teachersData, setTeachersData] = useState<Teacher[]>(teachers);
  const [classesData, setClassesData] = useState<SchoolClass[]>(classes);
  const [countriesData, setCountriesData] = useState<CountryProfile[]>(countries);
  const [coursesData, setCoursesData] = useState<Course[]>(courses);
  const [assignmentsData, setAssignmentsData] = useState<TeacherAssignment[]>(teacherAssignments);
  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>(payments);
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>(subscriptions);
  const [paymentStatusesData, setPaymentStatusesData] = useState<PaymentStatus[]>(paymentStatuses);
  const [presencesData, setPresencesData] = useState<PresenceItem[]>(presences);
  const [notesData, setNotesData] = useState<NoteItem[]>(notes);
  const [schoolsData, setSchoolsData] = useState<SchoolProfile[]>(schools);
  const [usersData, setUsersData] = useState<UserAccount[]>(userAccounts);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(announcements);
  const [messagesData, setMessagesData] = useState<SchoolMessage[]>(schoolMessages);
  const [rolePermissionsData, setRolePermissionsData] = useState<Record<string, string[]>>(initialRolePermissions);
  const [academicConfigData, setAcademicConfigData] = useState<AcademicManagementConfig>(defaultAcademicConfig);
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

  useEffect(() => {
    if (!canSyncBackOfficeState(session?.role, session?.accessToken)) {
      return;
    }

    let mounted = true;
    setSyncStatus("syncing");

    getBackOfficeState()
      .then((payload) => {
        if (!mounted) return;
        applySyncedState(payload);
        setSyncStatus("synced");
      })
      .catch(() => {
        if (!mounted) return;
        setSyncStatus("offline");
      });

    return () => {
      mounted = false;
    };
  }, [session?.accessToken, session?.role]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    let mounted = true;
    Promise.all([getStudents(), getClasses(), getCourses(), getNotes(), getAcademicConfig()])
      .then(([studentPayload, classPayload, coursePayload, notePayload, academicConfigPayload]) => {
        if (mounted) {
          applyArray(studentPayload, setStudentsData);
          applyArray(classPayload, setClassesData);
          applyArray(coursePayload, setCoursesData);
          applyArray(notePayload, setNotesData);
          setAcademicConfigData(academicConfigPayload as AcademicManagementConfig);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [session?.accessToken]);

  const applySyncedState = (payload: BackOfficeStatePayload) => {
    applyArray(payload.students, setStudentsData);
    applyArray(payload.teachers, setTeachersData);
    applyArray(payload.classes, setClassesData);
    applyArray(payload.countries, setCountriesData);
    applyArray(payload.courses, setCoursesData);
    applyArray(payload.assignments, setAssignmentsData);
    applyArray(payload.payments, setPaymentsData);
    applyArray(payload.subscriptions, setSubscriptionsData);
    applyArray(payload.paymentStatuses, setPaymentStatusesData);
    applyArray(payload.presences, setPresencesData);
    applyArray(payload.notes, setNotesData);
    applyArray(payload.schools, setSchoolsData);
    applyArray(payload.users, setUsersData);
    applyArray(payload.announcements, setAnnouncementsData);
    applyArray(payload.messages, setMessagesData);
    if (payload.rolePermissions && typeof payload.rolePermissions === "object") {
      setRolePermissionsData(payload.rolePermissions);
    }
    if (payload.academicConfigs && typeof payload.academicConfigs === "object") {
      const configs = payload.academicConfigs as Record<string, AcademicManagementConfig>;
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
    const state = stateSnapshot;

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
        const nextItems = updater(items);
        persistSyncedState({ ...state, [entity]: nextItems });
        return nextItems;
      });
    };

    return {
      studentsData,
      teachersData,
      classesData,
      countriesData,
      coursesData,
      assignmentsData,
      paymentsData,
      subscriptionsData,
      paymentStatusesData,
      presencesData,
      notesData,
      schoolsData,
      usersData,
      announcementsData,
      messagesData,
      rolePermissionsData,
      academicConfigData,
      syncStatus,
      getItems: (entity) => state[entity],
      createItem: (entity, item) => commitEntity(entity, (items) => [item, ...items]),
      updateItem: (entity, item) =>
        commitEntity(entity, (items) => items.map((row) => (row.id === item.id ? item : row))),
      deleteItem: (entity, id) =>
        commitEntity(entity, (items) => items.filter((row) => row.id !== id)),
      upsertPresenceItems: (items) =>
        setPresencesData((current) => {
          const keys = new Set(items.map((item) => `${item.studentId}-${item.date}`));
          const nextItems = [...items, ...current.filter((item) => !keys.has(`${item.studentId}-${item.date}`))];
          persistSyncedState({ ...state, presences: nextItems });
          return nextItems;
        }),
      upsertNoteItem: (item) =>
        setNotesData((current) => {
          const exists = current.some((row) => row.id === item.id);
          const nextItems = exists ? current.map((row) => (row.id === item.id ? item : row)) : [item, ...current];
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

function roleLabelFromSession(role?: string) {
  if (role === "super_admin") return "Super Administrateur SchoolLink";
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
