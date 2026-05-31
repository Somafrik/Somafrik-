const express = require("express");
const cors = require("cors");
const {
  school,
  teachers,
  classes,
  students,
  notes,
  presences,
  payments,
  announcements,
} = require("./data");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "SchoolLink API",
    status: "ok",
    endpoints: [
      "/api/health",
      "/api/login",
      "/api/school",
      "/api/classes",
      "/api/students",
      "/api/students/:id",
      "/api/students/:id/notes",
      "/api/students/:id/presences",
      "/api/students/:id/payments",
      "/api/teachers",
      "/api/payments",
      "/api/announcements",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", (req, res) => {
  const { role, schoolCode, identifier, pin } = req.body;

  if (!role || !schoolCode || !identifier || !pin) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  if (schoolCode !== school.code) {
    return res.status(401).json({ message: "Code etablissement invalide" });
  }

  if (role === "school_admin" && identifier === "admin" && pin === "1234") {
    return res.json({ role, user: { id: "ADMIN1", name: "Administrateur" }, school });
  }

  const student = students.find(
    (item) =>
      item.schoolCode === schoolCode &&
      (item.matricule === identifier || item.parentPhone === identifier) &&
      item.pin === pin
  );

  if (student) {
    const { pin: _pin, ...safeStudent } = student;
    return res.json({ role, user: safeStudent, school });
  }

  return res.status(401).json({ message: "Identifiants incorrects" });
});

app.get("/api/school", (req, res) => {
  res.json(school);
});

app.get("/api/classes", (req, res) => {
  const result = classes.map((item) => {
    const classStudents = students.filter((student) => student.className === item.name);
    const teacher = teachers.find((teacherItem) => teacherItem.id === item.teacherId);
    const classPresences = presences.filter((presence) =>
      classStudents.some((student) => student.id === presence.studentId)
    );
    const presentCount = classPresences.filter((presence) => presence.present).length;
    const presenceRate = classPresences.length
      ? Math.round((presentCount / classPresences.length) * 100)
      : 0;

    return {
      ...item,
      teacher: teacher?.name ?? "Non assigne",
      students: classStudents.length,
      presenceRate,
    };
  });

  res.json(result);
});

app.get("/api/students", (req, res) => {
  const { className } = req.query;
  const result = students
    .filter((student) => !className || student.className === className)
    .map(({ pin, ...student }) => student);

  res.json(result);
});

app.get("/api/students/:id", (req, res) => {
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  const { pin, ...safeStudent } = student;
  res.json(safeStudent);
});

app.get("/api/students/:id/notes", (req, res) => {
  res.json(notes.filter((note) => note.studentId === req.params.id));
});

app.get("/api/students/:id/presences", (req, res) => {
  res.json(presences.filter((presence) => presence.studentId === req.params.id));
});

app.get("/api/students/:id/payments", (req, res) => {
  res.json(payments.filter((payment) => payment.studentId === req.params.id));
});

app.get("/api/teachers", (req, res) => {
  res.json(teachers);
});

app.get("/api/payments", (req, res) => {
  const result = payments.map((payment) => {
    const student = students.find((item) => item.id === payment.studentId);
    return {
      ...payment,
      studentName: student?.name ?? "Eleve inconnu",
      className: student?.className ?? "",
    };
  });

  res.json(result);
});

app.get("/api/announcements", (req, res) => {
  res.json(announcements);
});

const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});
