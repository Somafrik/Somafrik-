export type Student = {
  id: string;
  publicId: string;
  name: string;
  firstName: string;
  matricule: string;
  gender: "Masculin" | "Féminin" | string;
  birthDate: string;
  className: string;
  schoolCode: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  archived?: boolean;
};

export type Teacher = {
  id: string;
  publicId: string;
  name: string;
  firstName: string;
  gender: "Masculin" | "Féminin" | string;
  phone: string;
  email: string;
  mainSubject: string;
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
  publicId: string;
  className: string;
  name: string;
  coefficient: number;
};

export type SchoolClass = {
  id: string;
  publicId: string;
  name: string;
  level: string;
  track: string;
  teacherId: string;
};

export type NoteItem = {
  id: string;
  studentId: string;
  subject: string;
  value: number;
  coefficient: number;
  date: string;
  evaluationId?: string;
  scale?: number;
  evaluationCoefficient?: number;
  authorId?: string;
  enteredAt?: string;
  audit?: {
    authorId: string;
    oldValue?: number;
    newValue: number;
    date: string;
  }[];
};

export type PresenceItem = {
  id: string;
  publicId: string;
  studentId: string;
  date: string;
  present: boolean;
  status?: "Présent" | "Absent" | "Retard" | string;
};

export type PaymentItem = {
  id: string;
  publicId: string;
  studentId: string;
  amount: number;
  date: string;
  status: string;
  method: string;
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
  teacherId?: string;
  theme: string;
  direction:
    | "École vers parent"
    | "Parent vers école"
    | "Enseignant vers parent"
    | "Parent vers enseignant"
    | string;
  message: string;
  status: "Envoyé" | "Distribué" | "Lu" | "Archivé" | "Nouveau" | "En cours" | "Traité" | string;
  date: string;
  attachmentUrl?: string;
  priority?: "Faible" | "Moyenne" | "Haute" | "Critique" | string;
  sentAt?: string;
  readAt?: string;
  archivedAt?: string;
  audit?: {
    action: string;
    actorId: string;
    date: string;
  }[];
};

export type UserAccount = {
  id: string;
  publicId: string;
  lastName: string;
  firstName: string;
  gender: "Masculin" | "Féminin" | string;
  phone: string;
  email?: string;
  role: string;
  secondaryRoles?: string[];
  scopeLevel: "Global" | "Pays" | "Établissement" | string;
  countryScope?: string;
  schoolCode: string;
  accessChannel: "BackOffice" | "Application" | string;
  identifier: string;
  status: "Actif" | "Suspendu" | "Désactivé" | string;
  permissions: string[];
  temporaryPassword?: string;
  photoUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  createdBy: string;
  history: string[];
};

export type SchoolProfile = {
  id: string;
  publicId: string;
  code: string;
  name: string;
  type: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  slogan: string;
  status: "Actif" | "Suspendu" | string;
  logoUrl?: string;
  schoolYear: string;
  timezone: string;
  language: string;
  dateFormat: string;
  primaryColor: string;
  subscriptionPlan: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxStudents: number;
  maxTeachers: number;
  createdAt: string;
};

export const school: SchoolProfile = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  publicId: "CD-2026-0001",
  code: "CD-2026-0001",
  name: "Université de Kinshasa",
  type: "Université",
  city: "Kinshasa",
  country: "RDC",
  address: "Avenue de l'Université, Kinshasa",
  phone: "+243 810 000 000",
  email: "contact@unikin.schoollink",
  website: "https://unikin.schoollink",
  currency: "CDF",
  slogan: "Excellence et Innovation",
  status: "Actif",
  logoUrl: "",
  schoolYear: "2025-2026",
  timezone: "Africa/Kinshasa",
  language: "Français",
  dateFormat: "JJ-MM-AAAA",
  primaryColor: "#2563EB",
  subscriptionPlan: "Premium",
  subscriptionStartDate: "01-09-2025",
  subscriptionEndDate: "31-08-2026",
  maxStudents: 1200,
  maxTeachers: 120,
  createdAt: "01-09-2025",
};

export const schools: SchoolProfile[] = [school];

export const rolePermissions: Record<string, string[]> = {
  "Super Administrateur SchoolLink": [
    "Contrôler tous les pays",
    "Contrôler tous les établissements",
    "Gérer administrateurs pays",
    "Gérer administrateurs écoles",
    "Gérer abonnements",
    "Gérer utilisateurs",
    "Voir rapports globaux",
    "Auditer connexions",
  ],
  "Admin Pays": [
    "Gérer établissements du pays",
    "Gérer admins écoles du pays",
    "Voir rapports pays",
    "Suivre abonnements pays",
    "Auditer utilisateurs pays",
  ],
  "Admin School": [
    "Voir élèves",
    "Gérer élèves",
    "Gérer enseignants",
    "Gérer classes",
    "Gérer cours",
    "Gérer paiements",
    "Gérer utilisateurs",
    "Gérer annonces",
  ],
  Directeur: [
    "Voir élèves",
    "Modifier notes",
    "Gérer paiements",
    "Gérer utilisateurs",
    "Voir rapports",
  ],
  Secrétaire: ["Voir élèves", "Gérer élèves", "Gérer paiements", "Gérer appels"],
  Enseignant: ["Voir élèves", "Modifier notes", "Faire appel", "Messages parents"],
  Parent: ["Voir enfant", "Voir paiements", "Messages école"],
  "Élève / Étudiant": ["Voir notes", "Voir présences", "Voir paiements"],
  Comptable: ["Gérer paiements", "Voir rapports financiers"],
  Surveillant: ["Voir élèves", "Gérer appels", "Gérer discipline"],
};

export const userAccounts: UserAccount[] = [
  {
    id: "USER-ADMIN1",
    publicId: "USR-2026-000001",
    lastName: "Administrateur",
    firstName: "SchoolLink",
    gender: "Masculin",
    phone: "+243 810 000 000",
    email: "admin@unikin.schoollink",
    role: "Admin School",
    secondaryRoles: [],
    scopeLevel: "Établissement",
    countryScope: "RDC",
    schoolCode: "CD-2026-0001",
    accessChannel: "Application",
    identifier: "admin",
    status: "Actif",
    permissions: rolePermissions["Admin School"],
    temporaryPassword: "",
    photoUrl: "",
    createdAt: "01-09-2025",
    lastLoginAt: "01-06-2026",
    createdBy: "Super Administrateur SchoolLink",
    history: ["Compte initial créé le 01-09-2025"],
  },
  {
    id: "USER-SUPERADMIN",
    publicId: "USR-2026-000002",
    lastName: "SchoolLink",
    firstName: "Super Admin",
    gender: "Masculin",
    phone: "+243 810 000 900",
    email: "superadmin@schoollink.app",
    role: "Super Administrateur SchoolLink",
    secondaryRoles: [],
    scopeLevel: "Global",
    countryScope: "",
    schoolCode: "*",
    accessChannel: "BackOffice",
    identifier: "superadmin",
    status: "Actif",
    permissions: rolePermissions["Super Administrateur SchoolLink"],
    temporaryPassword: "",
    photoUrl: "",
    createdAt: "01-09-2025",
    lastLoginAt: "01-06-2026",
    createdBy: "Système",
    history: ["Compte global créé le 01-09-2025"],
  },
  {
    id: "USER-COUNTRY-RDC",
    publicId: "USR-2026-000003",
    lastName: "Admin",
    firstName: "RDC",
    gender: "Masculin",
    phone: "+243 810 000 901",
    email: "admin.rdc@schoollink.app",
    role: "Admin Pays",
    secondaryRoles: [],
    scopeLevel: "Pays",
    countryScope: "RDC",
    schoolCode: "*",
    accessChannel: "BackOffice",
    identifier: "admin-rdc",
    status: "Actif",
    permissions: rolePermissions["Admin Pays"],
    temporaryPassword: "",
    photoUrl: "",
    createdAt: "01-09-2025",
    lastLoginAt: "01-06-2026",
    createdBy: "Super Administrateur SchoolLink",
    history: ["Compte admin pays RDC créé le 01-09-2025"],
  },
  {
    id: "USER-T1",
    publicId: "USR-2026-000004",
    lastName: "Kabeya",
    firstName: "Jean",
    gender: "Masculin",
    phone: "+243 810 000 101",
    email: "jean.kabeya@schoollink.cd",
    role: "Enseignant",
    secondaryRoles: [],
    scopeLevel: "Établissement",
    countryScope: "RDC",
    schoolCode: "CD-2026-0001",
    accessChannel: "Application",
    identifier: "T1",
    status: "Actif",
    permissions: rolePermissions.Enseignant,
    temporaryPassword: "",
    photoUrl: "",
    createdAt: "01-09-2025",
    lastLoginAt: "31-05-2026",
    createdBy: "Administrateur",
    history: ["Compte enseignant créé le 01-09-2025"],
  },
  {
    id: "USER-PARENT1",
    publicId: "USR-2026-000005",
    lastName: "Dupont",
    firstName: "Parent",
    gender: "Masculin",
    phone: "+243 820 000 001",
    email: "parent.dupont@example.com",
    role: "Parent",
    secondaryRoles: [],
    scopeLevel: "Établissement",
    countryScope: "RDC",
    schoolCode: "CD-2026-0001",
    accessChannel: "Application",
    identifier: "+243 820 000 001",
    status: "Actif",
    permissions: rolePermissions.Parent,
    temporaryPassword: "",
    photoUrl: "",
    createdAt: "01-09-2025",
    lastLoginAt: "31-05-2026",
    createdBy: "Administrateur",
    history: ["Compte parent créé le 01-09-2025"],
  },
];

export const teachers: Teacher[] = [
  {
    id: "T1",
    publicId: "CD-2026-0001-ENS-0001",
    name: "Jean Kabeya",
    firstName: "Jean",
    gender: "Masculin",
    phone: "+243 810 000 101",
    email: "jean.kabeya@schoollink.cd",
    mainSubject: "Mathématiques",
    assignments: [
      { className: "6ème A", course: "Mathématiques" },
      { className: "6ème B", course: "Mathématiques" },
      { className: "5ème A", course: "Physique" },
    ],
  },
  {
    id: "T2",
    publicId: "CD-2026-0001-ENS-0002",
    name: "Marie Mukendi",
    firstName: "Marie",
    gender: "Féminin",
    phone: "+243 810 000 102",
    email: "marie.mukendi@schoollink.cd",
    mainSubject: "Français",
    assignments: [
      { className: "6ème A", course: "Français" },
      { className: "5ème B", course: "Français" },
    ],
  },
  {
    id: "T3",
    publicId: "CD-2026-0001-ENS-0003",
    name: "Patrick Ilunga",
    firstName: "Patrick",
    gender: "Masculin",
    phone: "+243 810 000 103",
    email: "patrick.ilunga@schoollink.cd",
    mainSubject: "Sciences",
    assignments: [
      { className: "6ème B", course: "Sciences" },
      { className: "5ème A", course: "Sciences" },
    ],
  },
  {
    id: "T4",
    publicId: "CD-2026-0001-ENS-0004",
    name: "Sarah Mbuyi",
    firstName: "Sarah",
    gender: "Féminin",
    phone: "+243 810 000 104",
    email: "sarah.mbuyi@schoollink.cd",
    mainSubject: "Histoire",
    assignments: [
      { className: "5ème A", course: "Histoire" },
      { className: "5ème B", course: "Histoire" },
    ],
  },
];

export const courses: Course[] = [
  { id: "COURSE1", publicId: "COU-2026-000001", className: "6ème A", name: "Mathématiques", coefficient: 2 },
  { id: "COURSE2", publicId: "COU-2026-000002", className: "6ème A", name: "Français", coefficient: 1 },
  { id: "COURSE3", publicId: "COU-2026-000003", className: "6ème B", name: "Mathématiques", coefficient: 2 },
  { id: "COURSE4", publicId: "COU-2026-000004", className: "6ème B", name: "Sciences", coefficient: 2 },
  { id: "COURSE5", publicId: "COU-2026-000005", className: "5ème A", name: "Physique", coefficient: 2 },
  { id: "COURSE6", publicId: "COU-2026-000006", className: "5ème A", name: "Histoire", coefficient: 1 },
  { id: "COURSE7", publicId: "COU-2026-000007", className: "5ème B", name: "Français", coefficient: 1 },
  { id: "COURSE8", publicId: "COU-2026-000008", className: "5ème B", name: "Histoire", coefficient: 1 },
];

export const teacherAssignments: TeacherAssignment[] = teachers.flatMap((teacher) =>
  (teacher.assignments ?? []).map((assignment, index) => ({
    id: `${teacher.id}-ASSIGNMENT-${index + 1}`,
    teacherId: teacher.id,
    ...assignment,
  }))
);

export const classes: SchoolClass[] = [
  { id: "C1", publicId: "CLS-2026-000001", name: "6ème A", level: "6ème", track: "Générale", teacherId: "T1" },
  { id: "C2", publicId: "CLS-2026-000002", name: "6ème B", level: "6ème", track: "Générale", teacherId: "T2" },
  { id: "C3", publicId: "CLS-2026-000003", name: "5ème A", level: "5ème", track: "Sciences", teacherId: "T3" },
  { id: "C4", publicId: "CLS-2026-000004", name: "5ème B", level: "5ème", track: "Lettres", teacherId: "T4" },
];

export const students: Student[] = [
  { id: "1", publicId: "CD-2026-0001-ELE-0001", name: "Jean Dupont", firstName: "Jean", matricule: "CD-2026-0001-ELE-0001", gender: "Masculin", birthDate: "12-04-2012", className: "6ème A", schoolCode: "CD-2026-0001", parentName: "Parent Dupont", parentPhone: "+243 820 000 001", parentEmail: "parent.dupont@example.com", archived: false },
  { id: "2", publicId: "CD-2026-0001-ELE-0002", name: "Marie Martin", firstName: "Marie", matricule: "CD-2026-0001-ELE-0002", gender: "Féminin", birthDate: "18-09-2012", className: "6ème A", schoolCode: "CD-2026-0001", parentName: "Parent Martin", parentPhone: "+243 820 000 001", parentEmail: "parent.martin@example.com", archived: false },
  { id: "3", publicId: "CD-2026-0001-ELE-0003", name: "Paul Bernard", firstName: "Paul", matricule: "CD-2026-0001-ELE-0003", gender: "Masculin", birthDate: "03-02-2011", className: "6ème B", schoolCode: "CD-2026-0001", parentName: "Parent Bernard", parentPhone: "+243 820 000 003", parentEmail: "parent.bernard@example.com", archived: false },
  { id: "4", publicId: "CD-2026-0001-ELE-0004", name: "Sarah Mbala", firstName: "Sarah", matricule: "CD-2026-0001-ELE-0004", gender: "Féminin", birthDate: "21-07-2011", className: "5ème A", schoolCode: "CD-2026-0001", parentName: "Parent Mbala", parentPhone: "+243 820 000 004", parentEmail: "parent.mbala@example.com", archived: false },
];

export const notes: NoteItem[] = [
  { id: "N1", studentId: "1", subject: "Mathématiques", value: 15, coefficient: 2, date: "2026-05-20", evaluationId: "EVAL1", scale: 20, evaluationCoefficient: 1, authorId: "T1", enteredAt: "20-05-2026 09:00", audit: [{ authorId: "T1", newValue: 15, date: "20-05-2026 09:00" }] },
  { id: "N2", studentId: "1", subject: "Français", value: 13, coefficient: 1, date: "2026-05-22", evaluationId: "EVAL2", scale: 20, evaluationCoefficient: 1, authorId: "T2", enteredAt: "22-05-2026 10:00", audit: [{ authorId: "T2", newValue: 13, date: "22-05-2026 10:00" }] },
  { id: "N3", studentId: "2", subject: "Mathématiques", value: 16, coefficient: 2, date: "2026-05-21", evaluationId: "EVAL1", scale: 20, evaluationCoefficient: 1, authorId: "T1", enteredAt: "21-05-2026 09:00", audit: [{ authorId: "T1", newValue: 16, date: "21-05-2026 09:00" }] },
  { id: "N4", studentId: "3", subject: "Sciences", value: 12, coefficient: 2, date: "2026-05-23", evaluationId: "EVAL3", scale: 20, evaluationCoefficient: 1, authorId: "T3", enteredAt: "23-05-2026 11:00", audit: [{ authorId: "T3", newValue: 12, date: "23-05-2026 11:00" }] },
];

export const presences: PresenceItem[] = [
  { id: "P1", publicId: "PRE-2026-000001", studentId: "1", date: "2026-05-27", present: true, status: "Présent" },
  { id: "P2", publicId: "PRE-2026-000002", studentId: "1", date: "2026-05-28", present: false, status: "Absent" },
  { id: "P3", publicId: "PRE-2026-000003", studentId: "2", date: "2026-05-27", present: true, status: "Présent" },
  { id: "P4", publicId: "PRE-2026-000004", studentId: "3", date: "2026-05-27", present: true, status: "Retard" },
];

export const payments: PaymentItem[] = [
  { id: "PAY1", publicId: "PAY-2026-000001", studentId: "1", amount: 25000, date: "10-05-2026", status: "PAYE", method: "Mobile Money" },
  { id: "PAY2", publicId: "PAY-2026-000002", studentId: "1", amount: 15000, date: "25-05-2026", status: "EN_ATTENTE", method: "Espèces" },
  { id: "PAY3", publicId: "PAY-2026-000003", studentId: "2", amount: 25000, date: "10-05-2026", status: "PAYE", method: "Virement bancaire" },
  { id: "PAY4", publicId: "PAY-2026-000004", studentId: "3", amount: 25000, date: "12-05-2026", status: "PAYE", method: "Carte bancaire" },
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
    priority: "Haute",
    date: "31-05-2026",
    sentAt: "31-05-2026 08:15",
    audit: [{ action: "Création", actorId: "PARENT-+243 820 000 001", date: "31-05-2026 08:15" }],
  },
  {
    id: "MSG2",
    parentPhone: "+243 820 000 001",
    studentId: "2",
    theme: "Résultats scolaires",
    direction: "École vers parent",
    message: "Merci de passer à l'école cette semaine pour échanger avec le titulaire.",
    status: "Distribué",
    priority: "Moyenne",
    date: "31-05-2026",
    sentAt: "31-05-2026 10:20",
    audit: [{ action: "Création", actorId: "ADMIN1", date: "31-05-2026 10:20" }],
  },
  {
    id: "MSG3",
    parentPhone: "+243 820 000 001",
    studentId: "1",
    teacherId: "T1",
    theme: "Résultats scolaires",
    direction: "Enseignant vers parent",
    message: "Jean doit renforcer les exercices de mathématiques cette semaine.",
    status: "Nouveau",
    priority: "Moyenne",
    date: "31-05-2026",
    sentAt: "31-05-2026 11:05",
    audit: [{ action: "Création", actorId: "T1", date: "31-05-2026 11:05" }],
  },
  {
    id: "MSG4",
    parentPhone: "+243 820 000 001",
    studentId: "2",
    teacherId: "T2",
    theme: "Absence",
    direction: "Parent vers enseignant",
    message: "Marie sera absente demain matin pour un rendez-vous médical.",
    status: "Nouveau",
    priority: "Haute",
    date: "31-05-2026",
    attachmentUrl: "",
    sentAt: "31-05-2026 12:30",
    audit: [{ action: "Création", actorId: "PARENT-+243 820 000 001", date: "31-05-2026 12:30" }],
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
