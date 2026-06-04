const express = require("express");
const cors = require("cors");
const path = require("path");
const { AuthService, BusinessError } = require("./services/authService");
const { BackOfficeAccessService } = require("./services/backOfficeAccessService");
const { GradeBookService } = require("./services/gradeBookService");
const { MvpBusinessService } = require("./services/mvpBusinessService");
const { ReportPdfService } = require("./services/reportPdfService");
const { PostgresRepository } = require("./db/postgresRepository");

const app = express();
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://schoollink:schoollink123@localhost:5432/schoollink";
const repository = new PostgresRepository(databaseUrl);

app.use(cors());
app.use(express.json());
app.use("/backoffice", express.static(path.join(__dirname, "..", "BackOffice")));

app.get("/", asyncHandler(async (_req, res) => {
  res.json({
    name: "SchoolLink API",
    status: "ok",
    database: "postgresql",
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
      "/api/students/:id/report.pdf",
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
      "/api/mvp/dashboard",
      "/api/v2/subjects",
      "/api/v2/academic-years",
      "/api/v2/exams",
      "/api/v2/documents",
      "/api/v2/reports/advanced",
    ],
  });
}));

app.get("/api/health", asyncHandler(async (_req, res) => {
  await repository.init();
  res.json({ status: "ok", database: "postgresql" });
}));

app.get("/api/schools", asyncHandler(async (_req, res) => {
  const { platformSchools } = await getRuntime();
  res.json(platformSchools);
}));

app.get("/api/schools/:code", asyncHandler(async (req, res) => {
  const { platformSchools } = await getRuntime();
  const requestedCode = req.params.code.toUpperCase();
  const foundSchool = platformSchools.find((item) =>
    [item.code, item.publicId].some(
      (value) => String(value ?? "").trim().toUpperCase() === requestedCode
    )
  );

  if (!foundSchool) {
    return res.status(404).json({ message: "Code etablissement invalide" });
  }

  res.json(foundSchool);
}));

app.post("/api/backoffice/login", asyncHandler(async (req, res) => {
  const { backOfficeAccessService } = await getRuntime();
  handleBusinessResponse(res, () => backOfficeAccessService.login(req.body));
}));

app.post("/api/identify", asyncHandler(async (req, res) => {
  const { authService } = await getRuntime();
  handleBusinessResponse(res, () => authService.identify(req.body));
}));

app.post("/api/login", asyncHandler(async (req, res) => {
  const { authService } = await getRuntime();
  handleBusinessResponse(res, () => authService.login(req.body));
}));

app.get("/api/school", asyncHandler(async (_req, res) => {
  const { school } = await getRuntime();
  res.json(school);
}));

app.get("/api/classes", asyncHandler(async (_req, res) => {
  const { classes, students, teachers, presences } = await getRuntime();
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
}));

app.get("/api/students", asyncHandler(async (req, res) => {
  const { students } = await getRuntime();
  const { className } = req.query;
  const result = students
    .filter((student) => !className || student.className === className)
    .map(({ pin, pinHash, ...student }) => student);

  res.json(result);
}));

app.get("/api/students/:id", asyncHandler(async (req, res) => {
  const { students } = await getRuntime();
  const student = findStudent(students, req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  const { pin, pinHash, ...safeStudent } = student;
  res.json(safeStudent);
}));

app.get("/api/students/:id/notes", asyncHandler(async (req, res) => {
  const { notes, students } = await getRuntime();
  const student = findStudent(students, req.params.id);
  res.json(student ? notes.filter((note) => note.studentId === student.id) : []);
}));

app.get("/api/students/:id/report", asyncHandler(async (req, res) => {
  const { students, gradeBookService } = await getRuntime();
  const student = findStudent(students, req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  res.json(gradeBookService.generateReport(student.id));
}));

app.get("/api/students/:id/report.pdf", asyncHandler(async (req, res) => {
  const { students, gradeBookService, reportPdfService } = await getRuntime();
  const student = findStudent(students, req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  const period = req.query.period ? String(req.query.period) : "Trimestre 1";
  const report = gradeBookService.generateReport(student.id, period, "Publié");
  const pdf = reportPdfService.generateReportCardPdf(report);
  const filename = `bulletin-${student.matricule}-${period.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Content-Length", pdf.length);
  res.send(pdf);
}));

app.get("/api/students/:id/presences", asyncHandler(async (req, res) => {
  const { presences, students } = await getRuntime();
  const student = findStudent(students, req.params.id);
  res.json(student ? presences.filter((presence) => presence.studentId === student.id) : []);
}));

app.get("/api/students/:id/payments", asyncHandler(async (req, res) => {
  const { payments, students } = await getRuntime();
  const student = findStudent(students, req.params.id);
  res.json(student ? payments.filter((payment) => payment.studentId === student.id) : []);
}));

app.get("/api/teachers", asyncHandler(async (_req, res) => {
  const { teachers } = await getRuntime();
  res.json(
    teachers.map(({ password, passwordHash, pinHash, ...teacher }) => ({
      ...teacher,
      assignedClasses: [...new Set(teacher.assignments.map((item) => item.className))],
      courses: [...new Set(teacher.assignments.map((item) => item.course))],
    }))
  );
}));

app.get("/api/users", asyncHandler(async (_req, res) => {
  const { userAccounts } = await getRuntime();
  res.json(
    userAccounts.map(({ temporaryPassword, passwordHash, pinHash, ...user }) => ({
      ...user,
      hasTemporaryPassword: Boolean(temporaryPassword),
    }))
  );
}));

app.get("/api/payments", asyncHandler(async (_req, res) => {
  const { payments, students } = await getRuntime();
  const result = payments.map((payment) => {
    const student = students.find((item) => item.id === payment.studentId);
    return {
      ...payment,
      studentName: student?.name ?? "Eleve inconnu",
      className: student?.className ?? "",
    };
  });

  res.json(result);
}));

app.get("/api/announcements", asyncHandler(async (_req, res) => {
  const { announcements } = await getRuntime();
  res.json(announcements);
}));

app.get("/api/backoffice/countries", asyncHandler(async (_req, res) => {
  const { countries } = await getRuntime();
  res.json(countries);
}));

app.get("/api/backoffice/subscriptions", asyncHandler(async (_req, res) => {
  const { subscriptions } = await getRuntime();
  res.json(subscriptions);
}));

app.get("/api/backoffice/notifications", asyncHandler(async (_req, res) => {
  const { platformNotifications } = await getRuntime();
  res.json(platformNotifications);
}));

app.get("/api/v2/subjects", asyncHandler(async (_req, res) => {
  res.json(await repository.getSubjectsV2());
}));

app.post("/api/v2/subjects", asyncHandler(async (req, res) => {
  res.status(201).json(await repository.createSubject(req.body));
}));

app.delete("/api/v2/subjects/:code", asyncHandler(async (req, res) => {
  res.json(await repository.deleteSubject(req.params.code));
}));

app.get("/api/v2/academic-years", asyncHandler(async (_req, res) => {
  res.json(await repository.getAcademicYearsV2());
}));

app.get("/api/v2/exams", asyncHandler(async (_req, res) => {
  res.json(await repository.getExamsV2());
}));

app.get("/api/v2/documents", asyncHandler(async (_req, res) => {
  res.json(await repository.getDocumentsV2());
}));

app.get("/api/v2/reports/advanced", asyncHandler(async (_req, res) => {
  res.json(await repository.getAdvancedReportsV2());
}));

app.get("/api/mvp/readiness", asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getReadiness());
}));

app.get("/api/mvp/snapshot", asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getSnapshot());
}));

app.get("/api/mvp/dashboard", asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getEstablishmentDashboard());
}));

async function getRuntime() {
  const dataset = await repository.getDataset();
  const authService = new AuthService({
    school: dataset.school,
    teachers: dataset.teachers,
    students: dataset.students,
    userAccounts: dataset.userAccounts,
  });
  const gradeBookService = new GradeBookService({
    students: dataset.students,
    notes: dataset.notes,
    courses: dataset.courses,
  });
  const reportPdfService = new ReportPdfService({ school: dataset.school });
  const mvpBusinessService = new MvpBusinessService({
    school: dataset.school,
    students: dataset.students,
    classes: dataset.classes,
    courses: dataset.courses,
    notes: dataset.notes,
    payments: dataset.payments,
  });
  const backOfficeAccessService = new BackOfficeAccessService({
    school: dataset.school,
    schools: dataset.platformSchools,
    userAccounts: dataset.userAccounts,
    countries: dataset.countries,
    subscriptions: dataset.subscriptions,
    notifications: dataset.platformNotifications,
  });

  return {
    ...dataset,
    authService,
    gradeBookService,
    reportPdfService,
    mvpBusinessService,
    backOfficeAccessService,
  };
}

function handleBusinessResponse(res, action) {
  try {
    return res.json(action());
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    throw error;
  }
}

function findStudent(students, studentId) {
  const direct = students.find((item) => item.id === studentId || item.publicId === studentId);

  if (direct) {
    return direct;
  }

  if (/^\d+$/.test(String(studentId))) {
    return students[Number(studentId) - 1];
  }

  return undefined;
}

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  res.status(500).json({
    message: "Erreur interne SchoolLink",
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

repository
  .init()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Impossible d'initialiser PostgreSQL", error);
    process.exit(1);
  });
