export type Student = {
  id: string;
  name: string;
  matricule: string;
  className: string;
  schoolCode: string;
  parentPhone: string;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  phone: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  teacherId: string;
};

export type NoteItem = {
  id: string;
  studentId: string;
  subject: string;
  value: number;
  coefficient: number;
  date: string;
};

export type PresenceItem = {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
};

export type PaymentItem = {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: "PAYE" | "EN_ATTENTE";
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  date: string;
};

export const school = {
  id: "SCH001",
  code: "SCH001",
  name: "Université de Kinshasa",
  city: "Kinshasa",
  slogan: "Excellence et Innovation",
};

export const teachers: Teacher[] = [
  { id: "T1", name: "Jean Kabeya", subject: "Mathématiques", phone: "+243 810 000 101" },
  { id: "T2", name: "Marie Mukendi", subject: "Français", phone: "+243 810 000 102" },
  { id: "T3", name: "Patrick Ilunga", subject: "Sciences", phone: "+243 810 000 103" },
  { id: "T4", name: "Sarah Mbuyi", subject: "Histoire", phone: "+243 810 000 104" },
];

export const classes: SchoolClass[] = [
  { id: "C1", name: "6ème A", teacherId: "T1" },
  { id: "C2", name: "6ème B", teacherId: "T2" },
  { id: "C3", name: "5ème A", teacherId: "T3" },
  { id: "C4", name: "5ème B", teacherId: "T4" },
];

export const students: Student[] = [
  { id: "1", name: "Jean Dupont", matricule: "MAT001", className: "6ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 001" },
  { id: "2", name: "Marie Martin", matricule: "MAT002", className: "6ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 002" },
  { id: "3", name: "Paul Bernard", matricule: "MAT003", className: "6ème B", schoolCode: "SCH001", parentPhone: "+243 820 000 003" },
  { id: "4", name: "Sarah Mbala", matricule: "MAT004", className: "5ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 004" },
];

export const notes: NoteItem[] = [
  { id: "N1", studentId: "1", subject: "Mathématiques", value: 15, coefficient: 2, date: "2026-05-20" },
  { id: "N2", studentId: "1", subject: "Français", value: 13, coefficient: 1, date: "2026-05-22" },
  { id: "N3", studentId: "2", subject: "Mathématiques", value: 16, coefficient: 2, date: "2026-05-21" },
  { id: "N4", studentId: "3", subject: "Sciences", value: 12, coefficient: 2, date: "2026-05-23" },
];

export const presences: PresenceItem[] = [
  { id: "P1", studentId: "1", date: "2026-05-27", present: true },
  { id: "P2", studentId: "1", date: "2026-05-28", present: false },
  { id: "P3", studentId: "2", date: "2026-05-27", present: true },
  { id: "P4", studentId: "3", date: "2026-05-27", present: true },
];

export const payments: PaymentItem[] = [
  { id: "PAY1", studentId: "1", amount: 25000, date: "2026-05-10", status: "PAYE" },
  { id: "PAY2", studentId: "1", amount: 15000, date: "2026-05-25", status: "EN_ATTENTE" },
  { id: "PAY3", studentId: "2", amount: 25000, date: "2026-05-10", status: "PAYE" },
  { id: "PAY4", studentId: "3", amount: 25000, date: "2026-05-12", status: "PAYE" },
];

export const announcements: Announcement[] = [
  { id: "A1", title: "Réunion des parents", message: "Réunion générale samedi à 10h00.", date: "2026-05-30" },
  { id: "A2", title: "Examens", message: "Les évaluations commencent le 10 juin.", date: "2026-05-29" },
];

export function getStudentById(studentId: string) {
  return students.find((student) => student.id === studentId);
}

export function getTeacherById(teacherId: string) {
  return teachers.find((teacher) => teacher.id === teacherId);
}

export function getPresenceRate(studentIds: string[]) {
  const rows = presences.filter((presence) => studentIds.includes(presence.studentId));

  if (rows.length === 0) {
    return 0;
  }

  return Math.round((rows.filter((presence) => presence.present).length / rows.length) * 100);
}

export function getPaymentRate(studentIds: string[]) {
  const rows = payments.filter((payment) => studentIds.includes(payment.studentId));

  if (rows.length === 0) {
    return 0;
  }

  return Math.round((rows.filter((payment) => payment.status === "PAYE").length / rows.length) * 100);
}
