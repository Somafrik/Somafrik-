const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  school,
  platformSchools,
  teachers,
  classes,
  students,
  notes,
  presences,
  payments,
  announcements,
  userAccounts,
  countries,
  subscriptions,
  platformNotifications,
  courses,
} = require("./data");
const { AuthService, BusinessError } = require("./services/authService");
const { BackOfficeAccessService } = require("./services/backOfficeAccessService");
const { GradeBookService } = require("./services/gradeBookService");
const { MvpBusinessService } = require("./services/mvpBusinessService");

const app = express();
const authService = new AuthService({ school, teachers, students, userAccounts });
const gradeBookService = new GradeBookService({ students, notes, courses });
const mvpBusinessService = new MvpBusinessService({ school, students, classes, courses, notes, payments });
const backOfficeAccessService = new BackOfficeAccessService({
  school,
  schools: platformSchools,
  userAccounts,
  countries,
  subscriptions,
  notifications: platformNotifications,
});

app.use(cors());
app.use(express.json());
app.use("/backoffice", express.static(path.join(__dirname, "..", "BackOffice")));

app.get("/", (req, res) => {
  res.json({
    name: "SchoolLink API",
    status: "ok",
    endpoints: [
      "/api/health",
      "/api/schools",
      "/api/schools/:code",
      "/api/identify",
      "/api/login",
      "/api/backoffice/login",
      "/api/school",
      "/api/classes",
      "/api/students",
      "/api/students/:id",
      "/api/students/:id/notes",
      "/api/students/:id/report",
      "/api/students/:id/presences",
      "/api/students/:id/payments",
      "/api/teachers",
      "/api/users",
      "/api/payments",
      "/api/announcements",
      "/api/backoffice/countries",
      "/api/backoffice/subscriptions",
      "/api/backoffice/notifications",
      "/api/mvp/readiness",
      "/api/mvp/snapshot",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/schools", (req, res) => {
  res.json(platformSchools);
});

app.get("/api/schools/:code", (req, res) => {
  const foundSchool = platformSchools.find((item) => item.code === req.params.code.toUpperCase());

  if (!foundSchool) {
    return res.status(404).json({ message: "Code etablissement invalide" });
  }

  res.json(foundSchool);
});

app.post("/api/backoffice/login", (req, res) => {
  handleBusinessResponse(res, () => backOfficeAccessService.login(req.body));
});

app.post("/api/identify", (req, res) => {
  handleBusinessResponse(res, () => authService.identify(req.body));
});

app.post("/api/login", (req, res) => {
  handleBusinessResponse(res, () => authService.login(req.body));
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

app.get("/api/students/:id/report", (req, res) => {
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  res.json(gradeBookService.generateReport(req.params.id));
});

app.get("/api/students/:id/presences", (req, res) => {
  res.json(presences.filter((presence) => presence.studentId === req.params.id));
});

app.get("/api/students/:id/payments", (req, res) => {
  res.json(payments.filter((payment) => payment.studentId === req.params.id));
});

app.get("/api/teachers", (req, res) => {
  res.json(
    teachers.map(({ password, ...teacher }) => ({
      ...teacher,
      assignedClasses: [...new Set(teacher.assignments.map((item) => item.className))],
      courses: [...new Set(teacher.assignments.map((item) => item.course))],
    }))
  );
});

app.get("/api/users", (req, res) => {
  res.json(
    userAccounts.map(({ temporaryPassword, ...user }) => ({
      ...user,
      hasTemporaryPassword: Boolean(temporaryPassword),
    }))
  );
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

app.get("/api/backoffice/countries", (req, res) => {
  res.json(countries);
});

app.get("/api/backoffice/subscriptions", (req, res) => {
  res.json(subscriptions);
});

app.get("/api/backoffice/notifications", (req, res) => {
  res.json(platformNotifications);
});

app.get("/api/mvp/readiness", (req, res) => {
  res.json(mvpBusinessService.getReadiness());
});

app.get("/api/mvp/snapshot", (req, res) => {
  res.json(mvpBusinessService.getSnapshot());
});

function handleBusinessResponse(res, action) {
  try {
    return res.json(action());
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: "Erreur interne SchoolLink" });
  }
}

const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});
