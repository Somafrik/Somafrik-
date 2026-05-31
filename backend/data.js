const school = {
  id: "SCH001",
  code: "SCH001",
  name: "Universite de Kinshasa",
  city: "Kinshasa",
  slogan: "Excellence et Innovation",
};

const teachers = [
  {
    id: "T1",
    name: "Jean Kabeya",
    gender: "Masculin",
    phone: "+243 810 000 101",
    password: "1234",
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
    password: "1234",
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
    password: "1234",
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
    password: "1234",
    assignments: [
      { className: "5ème A", course: "Histoire" },
      { className: "5ème B", course: "Histoire" },
    ],
  },
];

const classes = [
  { id: "C1", name: "6ème A", teacherId: "T1" },
  { id: "C2", name: "6ème B", teacherId: "T2" },
  { id: "C3", name: "5ème A", teacherId: "T3" },
  { id: "C4", name: "5ème B", teacherId: "T4" },
];

const students = [
  { id: "1", name: "Jean Dupont", matricule: "MAT001", gender: "Masculin", className: "6ème A", schoolCode: "SCH001", pin: "1234", parentPhone: "+243 820 000 001" },
  { id: "2", name: "Marie Martin", matricule: "MAT002", gender: "Féminin", className: "6ème A", schoolCode: "SCH001", pin: "1234", parentPhone: "+243 820 000 001" },
  { id: "3", name: "Paul Bernard", matricule: "MAT003", gender: "Masculin", className: "6ème B", schoolCode: "SCH001", pin: "1234", parentPhone: "+243 820 000 003" },
  { id: "4", name: "Sarah Mbala", matricule: "MAT004", gender: "Féminin", className: "5ème A", schoolCode: "SCH001", pin: "1234", parentPhone: "+243 820 000 004" },
];

const notes = [
  { id: "N1", studentId: "1", subject: "Mathématiques", value: 15, coefficient: 2, date: "2026-05-20" },
  { id: "N2", studentId: "1", subject: "Français", value: 13, coefficient: 1, date: "2026-05-22" },
  { id: "N3", studentId: "2", subject: "Mathématiques", value: 16, coefficient: 2, date: "2026-05-21" },
  { id: "N4", studentId: "3", subject: "Sciences", value: 12, coefficient: 2, date: "2026-05-23" },
];

const presences = [
  { id: "P1", studentId: "1", date: "2026-05-27", present: true },
  { id: "P2", studentId: "1", date: "2026-05-28", present: false },
  { id: "P3", studentId: "2", date: "2026-05-27", present: true },
  { id: "P4", studentId: "3", date: "2026-05-27", present: true },
];

const payments = [
  { id: "PAY1", studentId: "1", amount: 25000, date: "2026-05-10", status: "PAYE" },
  { id: "PAY2", studentId: "1", amount: 15000, date: "2026-05-25", status: "EN_ATTENTE" },
  { id: "PAY3", studentId: "2", amount: 25000, date: "2026-05-10", status: "PAYE" },
  { id: "PAY4", studentId: "3", amount: 25000, date: "2026-05-12", status: "PAYE" },
];

const announcements = [
  { id: "A1", title: "Reunion des parents", message: "Reunion generale samedi a 10h00.", date: "2026-05-30" },
  { id: "A2", title: "Examens", message: "Les evaluations commencent le 10 juin.", date: "2026-05-29" },
];

module.exports = {
  school,
  teachers,
  classes,
  students,
  notes,
  presences,
  payments,
  announcements,
};
