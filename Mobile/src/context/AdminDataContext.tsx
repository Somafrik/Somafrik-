import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Announcement,
  PaymentItem,
  SchoolClass,
  Student,
  Teacher,
  announcements,
  classes,
  payments,
  students,
  teachers,
} from "../data/catalog";

export type AdminEntity = "students" | "teachers" | "classes" | "payments" | "announcements";

type AdminDataContextValue = {
  studentsData: Student[];
  teachersData: Teacher[];
  classesData: SchoolClass[];
  paymentsData: PaymentItem[];
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
  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>(payments);
  const [announcementsData, setAnnouncementsData] = useState<Announcement[]>(announcements);

  const value = useMemo<AdminDataContextValue>(() => {
    const state = {
      students: studentsData,
      teachers: teachersData,
      classes: classesData,
      payments: paymentsData,
      announcements: announcementsData,
    };

    const setters = {
      students: setStudentsData,
      teachers: setTeachersData,
      classes: setClassesData,
      payments: setPaymentsData,
      announcements: setAnnouncementsData,
    };

    return {
      studentsData,
      teachersData,
      classesData,
      paymentsData,
      announcementsData,
      getItems: (entity) => state[entity],
      createItem: (entity, item) => setters[entity]((items: any[]) => [item, ...items]),
      updateItem: (entity, item) =>
        setters[entity]((items: any[]) => items.map((row) => (row.id === item.id ? item : row))),
      deleteItem: (entity, id) =>
        setters[entity]((items: any[]) => items.filter((row) => row.id !== id)),
    };
  }, [announcementsData, classesData, paymentsData, studentsData, teachersData]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData doit etre utilise dans AdminDataProvider");
  }

  return context;
}
