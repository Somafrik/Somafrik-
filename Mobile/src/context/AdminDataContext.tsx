import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Announcement,
  CountryProfile,
  Course,
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
} from "../data/catalog";

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
  schoolsData: SchoolProfile[];
  usersData: UserAccount[];
  announcementsData: Announcement[];
  messagesData: SchoolMessage[];
  getItems: (entity: AdminEntity) => any[];
  createItem: (entity: AdminEntity, item: any) => void;
  updateItem: (entity: AdminEntity, item: any) => void;
  deleteItem: (entity: AdminEntity, id: string) => void;
  upsertPresenceItems: (items: PresenceItem[]) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
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
  const [schoolsData, setSchoolsData] = useState<SchoolProfile[]>(schools);
  const [usersData, setUsersData] = useState<UserAccount[]>(userAccounts);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(announcements);
  const [messagesData, setMessagesData] = useState<SchoolMessage[]>(schoolMessages);

  const value = useMemo<AdminDataContextValue>(() => {
    const state = {
      students: studentsData,
      teachers: teachersData,
      classes: classesData,
      countries: countriesData,
      courses: coursesData,
      assignments: assignmentsData,
      payments: paymentsData,
      subscriptions: subscriptionsData,
      paymentStatuses: paymentStatusesData,
      schools: schoolsData,
      users: usersData,
      announcements: announcementsData,
      messages: messagesData,
    };

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
      schoolsData,
      usersData,
      announcementsData,
      messagesData,
      getItems: (entity) => state[entity],
      createItem: (entity, item) => setters[entity]((items: any[]) => [item, ...items]),
      updateItem: (entity, item) =>
        setters[entity]((items: any[]) => items.map((row) => (row.id === item.id ? item : row))),
      deleteItem: (entity, id) =>
        setters[entity]((items: any[]) => items.filter((row) => row.id !== id)),
      upsertPresenceItems: (items) =>
        setPresencesData((current) => {
          const keys = new Set(items.map((item) => `${item.studentId}-${item.date}`));
          return [...items, ...current.filter((item) => !keys.has(`${item.studentId}-${item.date}`))];
        }),
    };
  }, [
    announcementsData,
    assignmentsData,
    classesData,
    countriesData,
    coursesData,
    messagesData,
    paymentsData,
    subscriptionsData,
    paymentStatusesData,
    presencesData,
    schoolsData,
    studentsData,
    teachersData,
    usersData,
  ]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData doit etre utilise dans AdminDataProvider");
  }

  return context;
}
