import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Announcement,
  Course,
  PaymentItem,
  PaymentStatus,
  SchoolClass,
  Student,
  Teacher,
  TeacherAssignment,
  announcements,
  classes,
  courses,
  payments,
  paymentStatuses,
  students,
  teacherAssignments,
  teachers,
} from "../data/catalog";

export type AdminEntity =
  | "students"
  | "teachers"
  | "classes"
  | "courses"
  | "assignments"
  | "payments"
  | "paymentStatuses"
  | "announcements";

type AdminDataContextValue = {
  studentsData: Student[];
  teachersData: Teacher[];
  classesData: SchoolClass[];
  coursesData: Course[];
  assignmentsData: TeacherAssignment[];
  paymentsData: PaymentItem[];
  paymentStatusesData: PaymentStatus[];
  announcementsData: Announcement[];
  getItems: (entity: AdminEntity) => any[];
  createItem: (entity: AdminEntity, item: any) => void;
  updateItem: (entity: AdminEntity, item: any) => void;
  deleteItem: (entity: AdminEntity, id: string) => void;
};

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [studentsData, setStudentsData] = useState<Student[]>(students);
  const [teachersData, setTeachersData] = useState<Teacher[]>(teachers);
  const [classesData, setClassesData] = useState<SchoolClass[]>(classes);
  const [coursesData, setCoursesData] = useState<Course[]>(courses);
  const [assignmentsData, setAssignmentsData] = useState<TeacherAssignment[]>(teacherAssignments);
  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>(payments);
  const [paymentStatusesData, setPaymentStatusesData] = useState<PaymentStatus[]>(paymentStatuses);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(announcements);

  const value = useMemo<AdminDataContextValue>(() => {
    const state = {
      students: studentsData,
      teachers: teachersData,
      classes: classesData,
      courses: coursesData,
      assignments: assignmentsData,
      payments: paymentsData,
      paymentStatuses: paymentStatusesData,
      announcements: announcementsData,
    };

    const setters = {
      students: setStudentsData,
      teachers: setTeachersData,
      classes: setClassesData,
      courses: setCoursesData,
      assignments: setAssignmentsData,
      payments: setPaymentsData,
      paymentStatuses: setPaymentStatusesData,
      announcements: setAnnouncementsData,
    };

    return {
      studentsData,
      teachersData,
      classesData,
      coursesData,
      assignmentsData,
      paymentsData,
      paymentStatusesData,
      announcementsData,
      getItems: (entity) => state[entity],
      createItem: (entity, item) => setters[entity]((items: any[]) => [item, ...items]),
      updateItem: (entity, item) =>
        setters[entity]((items: any[]) => items.map((row) => (row.id === item.id ? item : row))),
      deleteItem: (entity, id) =>
        setters[entity]((items: any[]) => items.filter((row) => row.id !== id)),
    };
  }, [
    announcementsData,
    assignmentsData,
    classesData,
    coursesData,
    paymentsData,
    paymentStatusesData,
    studentsData,
    teachersData,
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
