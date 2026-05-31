export type Student = {
  id: string;
  name: string;
  matricule: string;
  gender: "Masculin" | "Féminin" | string;
  className: string;
  schoolCode: string;
  parentPhone: string;
};

export type Teacher = {
  id: string;
  name: string;
  gender: "Masculin" | "Féminin" | string;
  phone: string;
  assignments?: TeacherAssignment[];
  assignedClasses?: string[];
  courses?: string[];
};

export type TeacherAssignment = {
  id?: string;
  teacherId?: string;
  className: string;
  course: string;
};

export type Course = {
  id: string;
  className: string;
  name: string;
  coefficient: number;
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
  status: string;
};

export type PaymentStatus = {
  id: string;
  label: string;
  value: "PAYE" | "EN_ATTENTE" | string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  date: string;
};

export type SchoolMessage = {
  id: string;
  parentPhone: string;
  studentId?: string;
  theme: string;
  direction: "École vers parent" | "Parent vers école" | string;
  message: string;
  status: "Nouveau" | "En cours" | "Traité" | string;
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
  {
    id: "T1",
    name: "Jean Kabeya",
    gender: "Masculin",
    phone: "+243 810 000 101",
    assignments: [
      { className: "6ème A", course: "Mathématiques" },
      { className: "6ème B", course: "Mathématiques" },
      { className: "5ème A", course: "Physique" },
    ],
  },
  {
    id: "T2",
    name: "Marie Mukendi",
    gender: "Féminin",
    phone: "+243 810 000 102",
    assignments: [
      { className: "6ème A", course: "Français" },
      { className: "5ème B", course: "Français" },
    ],
  },
  {
    id: "T3",
    name: "Patrick Ilunga",
    gender: "Masculin",
    phone: "+243 810 000 103",
    assignments: [
      { className: "6ème B", course: "Sciences" },
      { className: "5ème A", course: "Sciences" },
    ],
  },
  {
    id: "T4",
    name: "Sarah Mbuyi",
    gender: "Féminin",
    phone: "+243 810 000 104",
    assignments: [
      { className: "5ème A", course: "Histoire" },
      { className: "5ème B", course: "Histoire" },
    ],
  },
];

export const courses: Course[] = [
  { id: "COURSE1", className: "6ème A", name: "Mathématiques", coefficient: 2 },
  { id: "COURSE2", className: "6ème A", name: "Français", coefficient: 1 },
  { id: "COURSE3", className: "6ème B", name: "Mathématiques", coefficient: 2 },
  { id: "COURSE4", className: "6ème B", name: "Sciences", coefficient: 2 },
  { id: "COURSE5", className: "5ème A", name: "Physique", coefficient: 2 },
  { id: "COURSE6", className: "5ème A", name: "Histoire", coefficient: 1 },
  { id: "COURSE7", className: "5ème B", name: "Français", coefficient: 1 },
  { id: "COURSE8", className: "5ème B", name: "Histoire", coefficient: 1 },
];

export const teacherAssignments: TeacherAssignment[] = teachers.flatMap((teacher) =>
  (teacher.assignments ?? []).map((assignment, index) => ({
    id: `${teacher.id}-ASSIGNMENT-${index + 1}`,
    teacherId: teacher.id,
    ...assignment,
  }))
);

export const classes: SchoolClass[] = [
  { id: "C1", name: "6ème A", teacherId: "T1" },
  { id: "C2", name: "6ème B", teacherId: "T2" },
  { id: "C3", name: "5ème A", teacherId: "T3" },
  { id: "C4", name: "5ème B", teacherId: "T4" },
];

export const students: Student[] = [
  { id: "1", name: "Jean Dupont", matricule: "MAT001", gender: "Masculin", className: "6ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 001" },
  { id: "2", name: "Marie Martin", matricule: "MAT002", gender: "Féminin", className: "6ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 001" },
  { id: "3", name: "Paul Bernard", matricule: "MAT003", gender: "Masculin", className: "6ème B", schoolCode: "SCH001", parentPhone: "+243 820 000 003" },
  { id: "4", name: "Sarah Mbala", matricule: "MAT004", gender: "Féminin", className: "5ème A", schoolCode: "SCH001", parentPhone: "+243 820 000 004" },
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
  { id: "PAY1", studentId: "1", amount: 25000, date: "10-05-2026", status: "PAYE" },
  { id: "PAY2", studentId: "1", amount: 15000, date: "25-05-2026", status: "EN_ATTENTE" },
  { id: "PAY3", studentId: "2", amount: 25000, date: "10-05-2026", status: "PAYE" },
  { id: "PAY4", studentId: "3", amount: 25000, date: "12-05-2026", status: "PAYE" },
];

export const paymentStatuses: PaymentStatus[] = [
  { id: "STATUS1", label: "Payé", value: "PAYE" },
  { id: "STATUS2", label: "En attente", value: "EN_ATTENTE" },
];

export const announcements: Announcement[] = [
  { id: "A1", title: "Réunion des parents", message: "Réunion générale samedi à 10h00.", date: "30-05-2026" },
  { id: "A2", title: "Examens", message: "Les évaluations commencent le 10 juin.", date: "29-05-2026" },
];

export const messageThemes = [
  "Dérogation paiement",
  "Absence",
  "Discipline",
  "Résultats scolaires",
  "Santé",
  "Transport",
  "Autre",
];

export const schoolMessages: SchoolMessage[] = [
  {
    id: "MSG1",
    parentPhone: "+243 820 000 001",
    studentId: "1",
    theme: "Dérogation paiement",
    direction: "Parent vers école",
    message: "Demande de dérogation pour régler la deuxième tranche le 10 du mois prochain.",
    status: "Nouveau",
    date: "31-05-2026",
  },
  {
    id: "MSG2",
    parentPhone: "+243 820 000 001",
    studentId: "2",
    theme: "Résultats scolaires",
    direction: "École vers parent",
    message: "Merci de passer à l'école cette semaine pour échanger avec le titulaire.",
    status: "En cours",
    date: "31-05-2026",
  },
];

export function getStudentById(studentId: string) {
  return students.find((student) => student.id === studentId);
}

export function getTeacherById(teacherId: string) {
  return teachers.find((teacher) => teacher.id === teacherId);
}

export function getTeacherClasses(teacher: Teacher | undefined) {
  return [...new Set((teacher?.assignments ?? []).map((assignment) => assignment.className))];
}

export function getTeacherCourses(teacher: Teacher | undefined) {
  return [...new Set((teacher?.assignments ?? []).map((assignment) => assignment.course))];
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
