const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config();
const { AuthService, BusinessError } = require("./services/authService");
const { BackOfficeAccessService } = require("./services/backOfficeAccessService");
const { GradeBookService } = require("./services/gradeBookService");
const { MvpBusinessService } = require("./services/mvpBusinessService");
const { ReportPdfService } = require("./services/reportPdfService");
const { PostgresRepository } = require("./db/postgresRepository");
const { FallbackRepository } = require("./db/fallbackRepository");
const { TokenService } = require("./services/tokenService");
const { RbacService } = require("./services/rbacService");
const { PaginationService } = require("./services/paginationService");
const { CacheService } = require("./services/cacheService");
const { TenantScopeService } = require("./services/tenantScopeService");
const { AuditService } = require("./services/auditService");

const app = express();
const databaseUrl = process.env.DATABASE_URL ?? buildDatabaseUrl();
let repository = new PostgresRepository(databaseUrl);
const tokenService = new TokenService();
const rbacService = new RbacService();
const paginationService = new PaginationService();
const cacheService = new CacheService();
const tenantScopeService = new TenantScopeService();
let auditService = new AuditService(repository);

app.disable("x-powered-by");
app.use(appSecurityHeaders);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "1mb" }));
app.use(
  "/backoffice",
  express.static(path.join(__dirname, "..", "BackOffice"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  }),
);

app.get("/", asyncHandler(async (_req, res) => {
  res.json({
    name: "Somafrik API",
    status: "ok",
    database: repository.engine ?? "postgresql",
    endpoints: [
      "/api/health",
      "/api/schools",
      "/api/schools/:code",
      "/api/identify",
      "/api/login",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/backoffice/login",
      "/api/school",
      "/api/classes",
      "/api/courses",
      "/api/academic-config",
      "/api/students",
      "/api/students/:id",
      "/api/students/:id/notes",
      "/api/notes",
      "/api/presences",
      "/api/students/:id/report",
      "/api/students/:id/report.pdf",
      "/api/students/:id/presences",
      "/api/presences",
      "/api/students/:id/payments",
      "/api/teachers",
      "/api/users",
      "/api/payments",
      "/api/announcements",
      "/api/backoffice/countries",
      "/api/backoffice/subscriptions",
      "/api/backoffice/notifications",
      "/api/audit",
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
  res.json({
    status: "ok",
    database: repository.engine ?? "postgresql",
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp: new Date().toISOString(),
  });
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
  const response = handleBusinessAction(() => backOfficeAccessService.login(req.body));
  await sendAuthenticatedResponse(req, res, response, "backoffice_login");
}));

app.post("/api/identify", asyncHandler(async (req, res) => {
  const { authService } = await getRuntime();
  handleBusinessResponse(res, () => authService.identify(req.body));
}));

app.post("/api/login", asyncHandler(async (req, res) => {
  const { authService } = await getRuntime();
  const response = handleBusinessAction(() => authService.login(req.body));
  await sendAuthenticatedResponse(req, res, response, "mobile_login");
}));

app.post("/api/auth/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = req.body ?? {};
  const payload = tokenService.verify(refreshToken, "refresh");
  const session = await repository.findActiveSession(payload.sessionId, tokenService.hashToken(refreshToken));

  if (!session) {
    throw new BusinessError(401, "Session expirée ou révoquée");
  }

  const accessToken = tokenService.createAccessToken({
    sub: session.user_id,
    role: session.role,
    schoolCode: session.school_code ?? "*",
    countryCode: session.country_code ?? "",
    sessionId: payload.sessionId,
    permissions: rbacService.permissionsFor(session.role),
  });

  res.json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: tokenService.accessTokenTtlSeconds,
  });
}));

app.post("/api/auth/logout", requireAuth, asyncHandler(async (req, res) => {
  await repository.revokeSession(req.principal.sessionId, "logout");
  await auditService.record(req, "logout", "session", req.principal.sessionId);
  res.json({ message: "Déconnexion sécurisée effectuée" });
}));

app.post("/api/auth/change-password", requireAuth, asyncHandler(async (req, res) => {
  const newPassword = String(req.body?.newPassword ?? "").trim();
  if (newPassword.length < 6) {
    throw new BusinessError(400, "Le nouveau mot de passe doit contenir au moins 6 caractères.");
  }

  const updatedUser = await repository.changeUserPassword(req.principal.sub, newPassword);
  await auditService.record(req, "change_own_password", "user", req.principal.sub, {
    oldTemporaryPasswordInvalidated: true,
  });
  const { passwordHash, pinHash, password, pin, temporaryPassword, ...safeUser } = updatedUser;
  res.json({
    message: "Mot de passe mis à jour.",
    user: {
      ...safeUser,
      mustChangePassword: false,
    },
  });
}));

app.get("/api/school", requireAuth, asyncHandler(async (_req, res) => {
  const { school } = await getRuntime();
  res.json(school);
}));

app.get("/api/classes", requireAuth, asyncHandler(async (req, res) => {
  const { classes, students, teachers, presences } = await getAuthoritativeBackOfficeState();
  const scopedClasses = tenantScopeService.filterRows(classes, req.principal);
  const scopedStudents = tenantScopeService.filterRows(students, req.principal);
  const result = scopedClasses.map((item) => {
    const classStudents = scopedStudents.filter((student) => student.className === item.name);
    const teacher = teachers.find((teacherItem) => teacherItem.id === item.teacherId);
    const classPresences = presences.filter((presence) =>
      classStudents.some((student) => student.id === presence.studentId)
    );
    const presentCount = classPresences.filter((presence) => presence.present || presence.status === "Retard").length;
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

app.get("/api/courses", requireAuth, asyncHandler(async (req, res) => {
  const { courses } = await getAuthoritativeBackOfficeState();
  res.json(tenantScopeService.filterRows(courses, req.principal));
}));

app.get("/api/academic-config", requireAuth, asyncHandler(async (req, res) => {
  const config = await repository.getAcademicConfig(req.principal.schoolCode);
  res.json(config);
}));

app.put("/api/academic-config", requireAuth, asyncHandler(async (req, res) => {
  if (!["Super Administrateur OKAFRIK", "Admin Pays", "Admin School"].includes(req.principal.role)) {
    throw new BusinessError(403, "Seuls les administrateurs peuvent configurer la gestion académique.");
  }
  const saved = await repository.saveAcademicConfig(req.principal.schoolCode, req.body ?? {});
  await auditService.record(req, "save_academic_config", "academic_config", saved.schoolCode, saved);
  res.json(saved);
}));

app.get("/api/students", requireAuth, asyncHandler(async (req, res) => {
  const { students } = await getAuthoritativeBackOfficeState();
  const { className } = req.query;
  const result = tenantScopeService.filterRows(students, req.principal)
    .filter((student) => !className || student.className === className)
    .map(({ pin, pinHash, ...student }) => student);

  sendList(res, result, req.query, ["name", "matricule", "className", "parentPhone"]);
}));

app.get("/api/students/:id", requireAuth, asyncHandler(async (req, res) => {
  const { students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  const { pin, pinHash, ...safeStudent } = student;
  res.json(safeStudent);
}));

app.get("/api/students/:id/notes", requireAuth, asyncHandler(async (req, res) => {
  const { notes, students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? notes.filter((note) => note.studentId === student.id) : []);
}));

app.get("/api/notes", requireAuth, asyncHandler(async (req, res) => {
  const { notes, students } = await getAuthoritativeBackOfficeState();
  const scopedStudents = tenantScopeService.filterRows(students, req.principal);
  const studentIds = new Set(scopedStudents.map((student) => student.id));
  res.json(notes.filter((note) => studentIds.has(note.studentId)));
}));

app.get("/api/presences", requireAuth, asyncHandler(async (req, res) => {
  const { presences, students } = await getAuthoritativeBackOfficeState();
  const { className, date } = req.query;
  const scopedStudents = tenantScopeService.filterRows(students, req.principal)
    .filter((student) => !className || student.className === className);
  const studentIds = new Set(scopedStudents.map((student) => student.id));
  res.json(
    presences.filter((presence) =>
      studentIds.has(presence.studentId) &&
      (!date || String(presence.date) === String(date))
    )
  );
}));

app.post("/api/notes", requireAuth, asyncHandler(async (req, res) => {
  assertCanManageNotes(req.principal);
  const saved = await repository.upsertGrade(req.body ?? {}, req.principal);
  await auditService.record(req, "upsert_grade", "grade", saved.id, saved);
  res.status(201).json(saved);
}));

app.post("/api/presences", requireAuth, asyncHandler(async (req, res) => {
  assertCanManagePresences(req.principal);
  const saved = await repository.upsertAttendanceBatch(req.body ?? {}, req.principal);
  await auditService.record(req, "upsert_attendance", "attendance", req.body?.className ?? "batch", {
    count: saved.length,
    className: req.body?.className,
    date: req.body?.date,
  });
  res.status(201).json(saved);
}));

app.get("/api/students/:id/report", requireAuth, asyncHandler(async (req, res) => {
  const { gradeBookService } = await getRuntime();
  const { students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  res.json(gradeBookService.generateReport(student.id));
}));

app.get("/api/students/:id/report.pdf", requireAuth, asyncHandler(async (req, res) => {
  const { gradeBookService, reportPdfService } = await getRuntime();
  const { students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);

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

app.get("/api/students/:id/presences", requireAuth, asyncHandler(async (req, res) => {
  const { presences, students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? presences.filter((presence) => presence.studentId === student.id) : []);
}));

app.get("/api/students/:id/payments", requireAuth, asyncHandler(async (req, res) => {
  const { payments, students } = await getAuthoritativeBackOfficeState();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? payments.filter((payment) => payment.studentId === student.id) : []);
}));

app.get("/api/teachers", requireAuth, requirePermission("GET /api/teachers"), asyncHandler(async (req, res) => {
  const { teachers } = await getAuthoritativeBackOfficeState();
  const result = tenantScopeService.filterRows(teachers, req.principal).map(({ password, passwordHash, pinHash, ...teacher }) => ({
      ...teacher,
      assignedClasses: [...new Set((teacher.assignments ?? []).map((item) => item.className))],
      courses: [...new Set((teacher.assignments ?? []).map((item) => item.course))],
    }));
  sendList(res, result, req.query, ["name", "phone", "email", "mainSubject"]);
}));

app.get("/api/users", requireAuth, requirePermission("GET /api/users"), asyncHandler(async (req, res) => {
  const { users } = await getAuthoritativeBackOfficeState();
  const result = tenantScopeService.filterRows(users, req.principal).map(({ temporaryPassword, passwordHash, pinHash, ...user }) => ({
    ...user,
    hasTemporaryPassword: Boolean(temporaryPassword),
  }));
  sendList(res, result, req.query, ["firstName", "lastName", "identifier", "role", "schoolCode"]);
}));

app.post("/api/users/:id/reset-password", requireAuth, asyncHandler(async (req, res) => {
  const permissions = new Set(req.principal.permissions ?? []);
  if (!permissions.has("ALL_PRIVILEGES") && !permissions.has("COUNTRY_PRIVILEGES") && !permissions.has("Utilisateurs:UPDATE")) {
    throw new BusinessError(403, "Permission insuffisante pour réinitialiser le mot de passe.");
  }

  const { users } = await getAuthoritativeBackOfficeState();
  const scopedUsers = tenantScopeService.filterRows(users, req.principal);
  const target = scopedUsers.find((user) =>
    [user.id, user.publicId, user.identifier].some((value) => String(value ?? "") === String(req.params.id))
  );

  if (!target) {
    throw new BusinessError(404, "Utilisateur introuvable dans votre établissement.");
  }

  const temporaryPassword = String(req.body?.temporaryPassword ?? "").trim();
  if (temporaryPassword.length < 6) {
    throw new BusinessError(400, "Le mot de passe temporaire doit contenir au moins 6 caractères.");
  }

  const updatedUser = await repository.resetUserPassword(target.id, temporaryPassword);
  await auditService.record(req, "reset_user_password", "user", target.id, {
    user: target.identifier,
    oldPasswordInvalidated: true,
  });
  const { passwordHash, pinHash, password, pin, ...safeUser } = updatedUser;
  res.json({
    temporaryPassword,
    user: {
      ...safeUser,
      hasTemporaryPassword: true,
    },
  });
}));

app.get("/api/payments", requireAuth, requirePermission("GET /api/payments"), asyncHandler(async (req, res) => {
  const { payments, students } = await getAuthoritativeBackOfficeState();
  const scopedPayments = tenantScopeService.filterRows(payments, req.principal);
  const result = scopedPayments.map((payment) => {
    const student = students.find((item) => item.id === payment.studentId);
    return {
      ...payment,
      studentName: student?.name ?? "Eleve inconnu",
      className: student?.className ?? "",
    };
  });

  sendList(res, result, req.query, ["studentName", "className", "status", "method"]);
}));

app.get("/api/announcements", requireAuth, asyncHandler(async (req, res) => {
  const { announcements } = await getAuthoritativeBackOfficeState();
  res.json(tenantScopeService.filterRows(announcements, req.principal));
}));

app.get("/api/backoffice/countries", requireAuth, requirePermission("GET /api/backoffice/countries"), asyncHandler(async (req, res) => {
  const { countries } = await getRuntime();
  res.json(tenantScopeService.filterRows(countries, req.principal, { countryField: "code" }));
}));

app.get("/api/backoffice/subscriptions", requireAuth, requirePermission("GET /api/backoffice/subscriptions"), asyncHandler(async (req, res) => {
  const { subscriptions } = await getRuntime();
  sendList(res, tenantScopeService.filterRows(subscriptions, req.principal), req.query, ["schoolCode", "country", "plan", "status"]);
}));

app.get("/api/backoffice/notifications", requireAuth, requirePermission("GET /api/backoffice/notifications"), asyncHandler(async (req, res) => {
  const { platformNotifications } = await getRuntime();
  sendList(res, tenantScopeService.filterRows(platformNotifications, req.principal), req.query, ["title", "message", "type", "status"]);
}));

app.get("/api/backoffice/state", requireAuth, asyncHandler(async (req, res) => {
  assertBackOfficeManager(req.principal);
  const state = await getAuthoritativeBackOfficeState();
  res.json(scopeBackOfficeState(state, req.principal));
}));

app.put("/api/backoffice/state", requireAuth, asyncHandler(async (req, res) => {
  assertBackOfficeManager(req.principal);
  const currentState = await getAuthoritativeBackOfficeState();
  const requestedState = sanitizeBackOfficeState(req.body ?? {});
  const nextState = mergeScopedBackOfficeState(currentState, requestedState, req.principal);
  const saved = await repository.saveBackOfficeState(nextState);
  await auditService.record(req, "sync_backoffice_state", "backoffice_state", "default", {
    schools: saved.schools?.length ?? 0,
    users: saved.users?.length ?? 0,
    countries: saved.countries?.length ?? 0,
    subscriptions: saved.subscriptions?.length ?? 0,
    notifications: saved.notifications?.length ?? 0,
    students: saved.students?.length ?? 0,
    teachers: saved.teachers?.length ?? 0,
    classes: saved.classes?.length ?? 0,
    roles: Object.keys(saved.rolePermissions ?? {}).length,
  });
  res.json(scopeBackOfficeState(saved, req.principal));
}));

app.get("/api/audit", requireAuth, asyncHandler(async (req, res) => {
  if (!["Super Administrateur OKAFRIK", "Admin Pays"].includes(req.principal.role)) {
    throw new BusinessError(403, "Seuls les administrateurs habilités peuvent consulter l'audit.");
  }
  if (req.query.schoolCode) {
    tenantScopeService.assertSchoolAccess(req.principal, req.query.schoolCode);
  }
  const rows = await repository.getAuditLogs({
    schoolCode: req.query.schoolCode,
    userId: req.query.userId,
    action: req.query.action,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit,
  });
  sendList(res, tenantScopeService.filterRows(rows, req.principal), req.query, ["actor", "action", "entityType", "entityId", "schoolCode"]);
}));

app.get("/api/v2/subjects", requireAuth, requirePermission("GET /api/v2/subjects"), asyncHandler(async (req, res) => {
  const rows = await cacheService.remember("v2:subjects", () => repository.getSubjectsV2());
  sendList(res, tenantScopeService.filterRows(rows, req.principal), req.query, ["name", "code", "level", "status"]);
}));

app.post("/api/v2/subjects", requireAuth, requirePermission("POST /api/v2/subjects"), asyncHandler(async (req, res) => {
  tenantScopeService.assertSchoolAccess(req.principal, req.body.schoolCode ?? req.principal.schoolCode);
  const created = await repository.createSubject({ ...req.body, schoolCode: req.body.schoolCode ?? req.principal.schoolCode });
  cacheService.invalidate("v2:");
  await auditService.record(req, "create_subject", "subject", req.body.code, req.body);
  res.status(201).json(created);
}));

app.delete("/api/v2/subjects/:code", requireAuth, requirePermission("DELETE /api/v2/subjects/:code"), asyncHandler(async (req, res) => {
  const deleted = await repository.deleteSubject(req.params.code);
  cacheService.invalidate("v2:");
  await auditService.record(req, "delete_subject", "subject", req.params.code);
  res.json(deleted);
}));

app.get("/api/v2/academic-years", requireAuth, requirePermission("GET /api/v2/academic-years"), asyncHandler(async (req, res) => {
  const rows = await cacheService.remember("v2:academic-years", () => repository.getAcademicYearsV2());
  sendList(res, tenantScopeService.filterRows(rows, req.principal), req.query, ["name", "status"]);
}));

app.get("/api/v2/exams", requireAuth, requirePermission("GET /api/v2/exams"), asyncHandler(async (req, res) => {
  const rows = await cacheService.remember("v2:exams", () => repository.getExamsV2());
  sendList(res, tenantScopeService.filterRows(rows, req.principal), req.query, ["code", "name", "type", "className", "subject"]);
}));

app.get("/api/v2/documents", requireAuth, requirePermission("GET /api/v2/documents"), asyncHandler(async (req, res) => {
  const rows = await cacheService.remember("v2:documents", () => repository.getDocumentsV2());
  sendList(res, tenantScopeService.filterRows(rows, req.principal), req.query, ["code", "type", "title", "studentCode", "studentName"]);
}));

app.get("/api/v2/reports/advanced", requireAuth, requirePermission("GET /api/v2/reports/advanced"), asyncHandler(async (_req, res) => {
  res.json(await cacheService.remember("v2:reports:advanced", () => repository.getAdvancedReportsV2()));
}));

app.get("/api/mvp/readiness", requireAuth, asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getReadiness());
}));

app.get("/api/mvp/snapshot", requireAuth, asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getSnapshot());
}));

app.get("/api/mvp/dashboard", requireAuth, asyncHandler(async (_req, res) => {
  const { mvpBusinessService } = await getRuntime();
  res.json(mvpBusinessService.getEstablishmentDashboard());
}));

async function getRuntime() {
  const dataset = await repository.getDataset();
  const authService = new AuthService({
    school: dataset.school,
    schools: dataset.platformSchools,
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

function handleBusinessAction(action) {
  try {
    return action();
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error;
    }

    throw error;
  }
}

function assertBackOfficeManager(principal) {
  if (!principal || !["Super Administrateur OKAFRIK", "Admin Pays", "Admin School"].includes(principal.role)) {
    throw new BusinessError(403, "Accès BackOffice non autorisé");
  }
}

function assertCanManageNotes(principal) {
  const permissions = new Set(principal?.permissions ?? []);
  if (
    permissions.has("ALL_PRIVILEGES") ||
    permissions.has("COUNTRY_PRIVILEGES") ||
    permissions.has("Modifier notes") ||
    permissions.has("Notes:CREATE") ||
    permissions.has("Notes:UPDATE")
  ) {
    return;
  }

  throw new BusinessError(403, "Permission insuffisante pour modifier les notes.");
}

function assertCanManagePresences(principal) {
  const permissions = new Set(principal?.permissions ?? []);
  if (
    permissions.has("ALL_PRIVILEGES") ||
    permissions.has("COUNTRY_PRIVILEGES") ||
    permissions.has("Faire appel") ||
    permissions.has("Gérer appels") ||
    permissions.has("Présences:CREATE") ||
    permissions.has("Présences:UPDATE")
  ) {
    return;
  }

  throw new BusinessError(403, "Permission insuffisante pour enregistrer l'appel.");
}

function sanitizeBackOfficeState(payload = {}) {
  const state = {
    schools: Array.isArray(payload.schools) ? payload.schools : [],
    users: Array.isArray(payload.users) ? payload.users : [],
    countries: Array.isArray(payload.countries) ? payload.countries : [],
    subscriptions: Array.isArray(payload.subscriptions) ? payload.subscriptions : [],
    notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
    students: Array.isArray(payload.students) ? payload.students : [],
    teachers: Array.isArray(payload.teachers) ? payload.teachers : [],
    classes: Array.isArray(payload.classes) ? payload.classes : [],
    courses: Array.isArray(payload.courses) ? payload.courses : [],
    assignments: Array.isArray(payload.assignments) ? payload.assignments : [],
    payments: Array.isArray(payload.payments) ? payload.payments : [],
    paymentStatuses: Array.isArray(payload.paymentStatuses) ? payload.paymentStatuses : [],
    presences: Array.isArray(payload.presences) ? payload.presences : [],
    notes: Array.isArray(payload.notes) ? payload.notes : [],
    academicConfigs: isPlainObject(payload.academicConfigs) ? payload.academicConfigs : {},
    announcements: Array.isArray(payload.announcements) ? payload.announcements : [],
    messages: Array.isArray(payload.messages) ? payload.messages : [],
    auditLog: Array.isArray(payload.auditLog) ? payload.auditLog.slice(0, 200) : [],
    rolePermissions: isPlainObject(payload.rolePermissions) ? payload.rolePermissions : {},
    deletedRows: sanitizeDeletedRows(payload.deletedRows),
    updatedAt: new Date().toISOString(),
  };
  return applyDeletedRows(state, state.deletedRows);
}

const backOfficeDeletableEntities = [
  "schools",
  "users",
  "countries",
  "subscriptions",
  "notifications",
  "students",
  "teachers",
  "classes",
  "courses",
  "assignments",
  "payments",
  "paymentStatuses",
  "presences",
  "notes",
  "announcements",
  "messages",
];

async function getAuthoritativeBackOfficeState() {
  const storedState = await repository.getBackOfficeState();
  if (hasUserBackOfficeState(storedState)) {
    return sanitizeBackOfficeState(storedState);
  }

  const runtime = await getRuntime();
  return sanitizeBackOfficeState(buildInitialBackOfficeState(runtime));
}

function hasUserBackOfficeState(state) {
  if (!isPlainObject(state)) {
    return false;
  }

  return backOfficeDeletableEntities.some((entity) => Array.isArray(state[entity]));
}

function buildInitialBackOfficeState(runtime = {}) {
  return {
    schools: runtime.platformSchools ?? [],
    users: runtime.userAccounts ?? [],
    countries: runtime.countries ?? [],
    subscriptions: runtime.subscriptions ?? [],
    notifications: runtime.platformNotifications ?? [],
    students: runtime.students ?? [],
    teachers: runtime.teachers ?? [],
    classes: runtime.classes ?? [],
    courses: runtime.courses ?? [],
    assignments: runtime.teacherAssignments ?? [],
    payments: runtime.payments ?? [],
    paymentStatuses: [],
    presences: runtime.presences ?? [],
    notes: runtime.notes ?? [],
    academicConfigs: {},
    announcements: runtime.announcements ?? [],
    messages: [],
    auditLog: [],
    rolePermissions: {},
    deletedRows: {},
  };
}

function mergeBackOfficeRuntimeState(runtime = {}, storedState = {}) {
  const storedDeletedRows = sanitizeDeletedRows(storedState.deletedRows);
  const runtimeState = {
    schools: runtime.platformSchools ?? [],
    users: runtime.userAccounts ?? [],
    countries: runtime.countries ?? [],
    subscriptions: runtime.subscriptions ?? [],
    notifications: runtime.platformNotifications ?? [],
    students: runtime.students ?? [],
    teachers: runtime.teachers ?? [],
    classes: runtime.classes ?? [],
    courses: runtime.courses ?? [],
    assignments: runtime.teacherAssignments ?? [],
    payments: runtime.payments ?? [],
    paymentStatuses: storedState.paymentStatuses ?? [],
    presences: runtime.presences ?? [],
    notes: runtime.notes ?? [],
    academicConfigs: storedState.academicConfigs ?? {},
    announcements: runtime.announcements ?? [],
    messages: storedState.messages ?? [],
    auditLog: storedState.auditLog ?? [],
    rolePermissions: storedState.rolePermissions ?? {},
    deletedRows: storedDeletedRows,
  };
  const deletedRows = mergeDeletedRows(storedDeletedRows, inferDeletedRowsFromStoredSnapshot(runtimeState, storedState));

  const merged = {
    ...runtimeState,
    ...storedState,
    schools: mergeRowsByIdentity(runtimeState.schools, storedState.schools),
    users: mergeRowsByIdentity(runtimeState.users, storedState.users),
    countries: mergeRowsByIdentity(runtimeState.countries, storedState.countries),
    subscriptions: mergeRowsByIdentity(runtimeState.subscriptions, storedState.subscriptions),
    notifications: mergeRowsByIdentity(runtimeState.notifications, storedState.notifications),
    students: mergeRowsByIdentity(runtimeState.students, storedState.students),
    teachers: mergeRowsByIdentity(runtimeState.teachers, storedState.teachers),
    classes: mergeRowsByIdentity(runtimeState.classes, storedState.classes),
    courses: mergeRowsByIdentity(runtimeState.courses, storedState.courses),
    payments: mergeRowsByIdentity(runtimeState.payments, storedState.payments),
    presences: mergeRowsByIdentity(runtimeState.presences, storedState.presences),
    notes: mergeRowsByIdentity(runtimeState.notes, storedState.notes),
    announcements: mergeRowsByIdentity(runtimeState.announcements, storedState.announcements),
    rolePermissions: {
      ...runtimeState.rolePermissions,
      ...(storedState.rolePermissions ?? {}),
    },
    academicConfigs: {
      ...runtimeState.academicConfigs,
      ...(storedState.academicConfigs ?? {}),
    },
    deletedRows,
  };

  return applyDeletedRows(merged, merged.deletedRows);
}

function mergeRowsByIdentity(primaryRows = [], secondaryRows = []) {
  const rows = new Map();
  [...primaryRows, ...secondaryRows].forEach((row, index) => {
    const key = row?.id ?? row?.publicId ?? row?.code ?? row?.studentId ?? `row-${index}`;
    rows.set(String(key), row);
  });
  return [...rows.values()];
}

function scopeBackOfficeState(payload = {}, principal) {
  const state = sanitizeBackOfficeState(payload);
  if (!principal || principal.role === "Super Administrateur OKAFRIK") {
    return state;
  }

  if (principal.role === "Admin Pays") {
    const countryCode = principal.countryCode;
    const schools = state.schools.filter((item) => countryCodeFromSchoolOrCountry(item.code, item.country) === countryCode);
    const schoolCodes = new Set(schools.map((item) => item.code));
    const scopedState = scopeStateWithSchools(state, schoolCodes, { countries: state.countries.filter((item) => item.code === countryCode) });
    return {
      ...scopedState,
      users: scopedState.users.filter((item) => item.role === "Admin School"),
    };
  }

  const schoolCodes = new Set([principal.schoolCode].filter(Boolean));
  return scopeStateWithSchools(state, schoolCodes, { subscriptions: [] });
}

function scopeStateWithSchools(state, schoolCodes, overrides = {}) {
  const students = state.students.filter((item) => hasSchoolScope(item, schoolCodes));
  const studentIds = new Set(students.map((item) => item.id));
  const classNames = new Set(students.map((item) => item.className).filter(Boolean));
  const teachers = state.teachers.filter((item) =>
    hasSchoolScope(item, schoolCodes) ||
    (item.assignedClasses ?? []).some((className) => classNames.has(className)) ||
    (item.assignments ?? []).some((assignment) => classNames.has(assignment.className))
  );
  const teacherIds = new Set(teachers.map((item) => item.id));
  const classes = state.classes.filter((item) => hasSchoolScope(item, schoolCodes) || classNames.has(item.name));
  classes.forEach((item) => {
    if (item.name) classNames.add(item.name);
  });

  const courses = state.courses.filter((item) => hasSchoolScope(item, schoolCodes) || classNames.has(item.className));
  const assignments = state.assignments.filter((item) =>
    hasSchoolScope(item, schoolCodes) ||
    classNames.has(item.className) ||
    teacherIds.has(item.teacherId)
  );
  const users = state.users.filter((item) => hasSchoolScope(item, schoolCodes));
  const schools = state.schools.filter((item) => schoolCodes.has(item.code));
  const subscriptions = state.subscriptions.filter((item) => hasSchoolScope(item, schoolCodes));
  const payments = state.payments.filter((item) => belongsToScopedStudentOrSchool(item, schoolCodes, studentIds));
  const paymentStatuses = state.paymentStatuses.filter((item) => hasSchoolScope(item, schoolCodes));
  const presences = state.presences.filter((item) => belongsToScopedStudentOrSchool(item, schoolCodes, studentIds));
  const notes = state.notes.filter((item) => belongsToScopedStudentOrSchool(item, schoolCodes, studentIds));
  const announcements = state.announcements.filter((item) => hasSchoolScope(item, schoolCodes));
  const messages = state.messages.filter((item) => !item.studentId ? hasSchoolScope(item, schoolCodes) : belongsToScopedStudentOrSchool(item, schoolCodes, studentIds));
  const academicConfigs = Object.fromEntries(
    Object.entries(state.academicConfigs).filter(([schoolCode]) => schoolCodes.has(schoolCode))
  );

  return {
    ...state,
    schools,
    users,
    students,
    teachers,
    classes,
    courses,
    assignments,
    payments,
    paymentStatuses,
    subscriptions: overrides.subscriptions ?? subscriptions,
    presences,
    notes,
    announcements,
    messages,
    academicConfigs,
    countries: overrides.countries ?? state.countries,
  };
}

function mergeScopedBackOfficeState(currentPayload = {}, requestedPayload = {}, principal) {
  const current = sanitizeBackOfficeState(currentPayload);
  const requested = sanitizeBackOfficeState(requestedPayload);

  if (!principal || principal.role === "Super Administrateur OKAFRIK") {
    return applyDeletedRows({
      ...requested,
      deletedRows: mergeDeletedRows(
        current.deletedRows,
        detectDeletedRows(current, requested, backOfficeDeletableEntities)
      ),
    });
  }

  const scopedCurrent = scopeBackOfficeState(current, principal);
  const scopedRequested = scopeBackOfficeState(requested, principal);
  const editableEntities = getEditableEntitiesForPrincipal(principal);
  const deletedRows = mergeDeletedRows(
    current.deletedRows,
    detectDeletedRows(scopedCurrent, scopedRequested, editableEntities)
  );

  return applyDeletedRows({
    ...current,
    schools: mergeScopedRows(current.schools, scopedRequested.schools, scopedCurrent.schools),
    users: mergeScopedRows(current.users, scopedRequested.users, scopedCurrent.users),
    countries: principal.role === "Admin Pays" ? mergeScopedRows(current.countries, scopedRequested.countries, scopedCurrent.countries) : current.countries,
    subscriptions: principal.role === "Admin School" ? current.subscriptions : mergeScopedRows(current.subscriptions, scopedRequested.subscriptions, scopedCurrent.subscriptions),
    notifications: current.notifications,
    students: mergeScopedRows(current.students, scopedRequested.students, scopedCurrent.students),
    teachers: mergeScopedRows(current.teachers, scopedRequested.teachers, scopedCurrent.teachers),
    classes: mergeScopedRows(current.classes, scopedRequested.classes, scopedCurrent.classes),
    courses: mergeScopedRows(current.courses, scopedRequested.courses, scopedCurrent.courses),
    assignments: mergeScopedRows(current.assignments, scopedRequested.assignments, scopedCurrent.assignments),
    payments: mergeScopedRows(current.payments, scopedRequested.payments, scopedCurrent.payments),
    paymentStatuses: mergeScopedRows(current.paymentStatuses, scopedRequested.paymentStatuses, scopedCurrent.paymentStatuses),
    presences: mergeScopedRows(current.presences, scopedRequested.presences, scopedCurrent.presences),
    notes: mergeScopedRows(current.notes, scopedRequested.notes, scopedCurrent.notes),
    announcements: mergeScopedRows(current.announcements, scopedRequested.announcements, scopedCurrent.announcements),
    messages: mergeScopedRows(current.messages, scopedRequested.messages, scopedCurrent.messages),
    rolePermissions: current.rolePermissions,
    academicConfigs: {
      ...current.academicConfigs,
      ...scopedRequested.academicConfigs,
    },
    auditLog: current.auditLog,
    deletedRows,
    updatedAt: new Date().toISOString(),
  });
}

function mergeScopedRows(currentRows, requestedScopedRows, currentScopedRows) {
  const scopedKeys = new Set(currentScopedRows.map(rowKey));
  const requestedKeys = new Set(requestedScopedRows.map(rowKey));
  return [
    ...requestedScopedRows,
    ...currentRows.filter((row) => !scopedKeys.has(rowKey(row)) && !requestedKeys.has(rowKey(row))),
  ];
}

function rowKey(row = {}) {
  return String(row.id ?? row.publicId ?? row.code ?? row.schoolCode ?? row.value ?? JSON.stringify(row));
}

function getEditableEntitiesForPrincipal(principal) {
  if (!principal || principal.role === "Super Administrateur OKAFRIK") {
    return backOfficeDeletableEntities;
  }

  if (principal.role === "Admin Pays") {
    return ["schools", "users", "countries", "subscriptions"];
  }

  return [
    "users",
    "students",
    "teachers",
    "classes",
    "courses",
    "assignments",
    "payments",
    "paymentStatuses",
    "presences",
    "notes",
    "announcements",
    "messages",
  ];
}

function detectDeletedRows(currentState = {}, requestedState = {}, entities = []) {
  return entities.reduce((deletedRows, entity) => {
    const currentRows = Array.isArray(currentState[entity]) ? currentState[entity] : [];
    const requestedRows = Array.isArray(requestedState[entity]) ? requestedState[entity] : [];
    const requestedKeys = new Set(requestedRows.map(rowKey));
    const deletedKeys = currentRows
      .map(rowKey)
      .filter((key) => key && !requestedKeys.has(key));

    if (deletedKeys.length) {
      deletedRows[entity] = deletedKeys;
    }

    return deletedRows;
  }, {});
}

function mergeDeletedRows(...sources) {
  const merged = {};
  sources.forEach((source) => {
    const normalized = sanitizeDeletedRows(source);
    Object.entries(normalized).forEach(([entity, keys]) => {
      merged[entity] = [...new Set([...(merged[entity] ?? []), ...keys])];
    });
  });
  return merged;
}

function inferDeletedRowsFromStoredSnapshot(runtimeState = {}, storedState = {}) {
  return backOfficeDeletableEntities.reduce((deletedRows, entity) => {
    if (!Object.prototype.hasOwnProperty.call(storedState, entity) || !Array.isArray(storedState[entity])) {
      return deletedRows;
    }

    const runtimeRows = Array.isArray(runtimeState[entity]) ? runtimeState[entity] : [];
    const storedKeys = new Set(storedState[entity].map(rowKey));
    const missingKeys = runtimeRows
      .map(rowKey)
      .filter((key) => key && !storedKeys.has(key));

    if (missingKeys.length) {
      deletedRows[entity] = missingKeys;
    }

    return deletedRows;
  }, {});
}

function sanitizeDeletedRows(value = {}) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([entity, keys]) => backOfficeDeletableEntities.includes(entity) && Array.isArray(keys))
      .map(([entity, keys]) => [entity, [...new Set(keys.map((key) => String(key)).filter(Boolean))]])
  );
}

function applyDeletedRows(state = {}, deletedRows = state.deletedRows ?? {}) {
  const normalizedDeletedRows = sanitizeDeletedRows(deletedRows);
  const nextState = { ...state, deletedRows: normalizedDeletedRows };

  backOfficeDeletableEntities.forEach((entity) => {
    const rows = Array.isArray(nextState[entity]) ? nextState[entity] : [];
    const deletedKeys = new Set(normalizedDeletedRows[entity] ?? []);
    if (deletedKeys.size) {
      nextState[entity] = rows.filter((row) => !deletedKeys.has(rowKey(row)));
    }
  });

  return nextState;
}

function hasSchoolScope(row = {}, schoolCodes) {
  return (
    schoolCodes.has(row.schoolCode) ||
    schoolCodes.has(row.code) ||
    schoolCodes.has(row.publicId)
  );
}

function belongsToScopedStudentOrSchool(row = {}, schoolCodes, studentIds) {
  if (row.studentId) {
    return studentIds.has(row.studentId);
  }

  return hasSchoolScope(row, schoolCodes);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function sendAuthenticatedResponse(req, res, response, action) {
  const principal = buildPrincipal(response);
  if (action === "backoffice_login" && ["Super Administrateur OKAFRIK", "Admin Pays"].includes(principal.role)) {
    const auditRows = await repository.getAuditLogs({ limit: 100 });
    response.auditLog = tenantScopeService.filterRows(auditRows, principal);
  }
  const refreshSession = tokenService.createRefreshToken(principal);
  const accessToken = tokenService.createAccessToken({
    ...principal,
    sessionId: refreshSession.sessionId,
  });

  await repository.createSession({
    sessionId: refreshSession.sessionId,
    refreshTokenHash: tokenService.hashToken(refreshSession.token),
    userId: principal.sub,
    schoolCode: principal.schoolCode,
    role: principal.role,
    expiresAt: refreshSession.expiresAt,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  await repository.recordAudit({
    schoolCode: principal.schoolCode,
    userId: principal.sub,
    action,
    entityType: "session",
    entityId: refreshSession.sessionId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    newValue: { role: principal.role, schoolCode: principal.schoolCode },
  });

  res.json({
    ...response,
    user: response.user ? { ...response.user, permissions: principal.permissions } : response.user,
    accessToken,
    refreshToken: refreshSession.token,
    tokenType: "Bearer",
    expiresIn: tokenService.accessTokenTtlSeconds,
    permissions: principal.permissions,
  });
}

function buildPrincipal(response) {
  const user = response.user ?? {};
  const school = response.schoolContext ?? response.school ?? {};
  const role = user.role ?? roleLabelFromMobileRole(response.role);
  const schoolCode = role === "Admin Pays" ? "*" : user.schoolCode ?? school.code ?? "*";
  const countryCode = user.countryCode ?? countryCodeFromScope(user.countryScope) ?? school.countryCode ?? countryCodeFromSchoolOrCountry(schoolCode, school.country);
  const permissions = enforceBusinessRolePermissions(role, user.permissions ?? rbacService.permissionsFor(role));

  return {
    sub: user.id ?? user.publicId ?? user.matricule ?? "anonymous",
    role,
    schoolCode,
    countryCode,
    permissions,
    studentIds: getPrincipalStudentIds(response),
    classNames: user.assignedClasses ?? [],
  };
}

function enforceBusinessRolePermissions(role, permissions = []) {
  if (role !== "Admin School") {
    return permissions;
  }

  const forbiddenFeatures = ["Établissements", "Abonnements", "Paramètres Établissement"];
  const forbiddenKeywords = ["abonnement", "etablissement", "établissement", "inscription", "tarif"];
  return permissions.filter((permission) => {
    const normalizedPermission = normalizeBusinessPermission(permission);
    return (
      !forbiddenFeatures.some((feature) => String(permission).startsWith(feature)) &&
      !forbiddenKeywords.some((keyword) => normalizedPermission.includes(keyword))
    );
  });
}

function normalizeBusinessPermission(permission) {
  return String(permission ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPrincipalStudentIds(response) {
  const user = response.user ?? {};
  const role = user.role ?? roleLabelFromMobileRole(response.role);

  if (role === "Parent") {
    return (user.children ?? []).map((student) => student.id).filter(Boolean);
  }

  if (role === "Élève / Étudiant") {
    return [user.id].filter(Boolean);
  }

  return [];
}

function roleLabelFromMobileRole(role) {
  if (role === "super_admin") return "Super Administrateur OKAFRIK";
  if (role === "country_admin") return "Admin Pays";
  if (role === "school_admin") return "Admin School";
  if (role === "principal") return "Proviseur";
  if (role === "prefet") return "Préfet des études";
  if (role === "secretary") return "Secrétaire";
  if (role === "teacher") return "Enseignant";
  if (role === "student") return "Élève / Étudiant";
  if (role === "parent_student") return "Parent";
  return role;
}

function countryCodeFromSchoolOrCountry(schoolCode, country) {
  const fromScope = countryCodeFromScope(country);
  if (fromScope) return fromScope;
  return String(schoolCode ?? "").slice(0, 2).toUpperCase();
}

function countryCodeFromScope(countryScope) {
  const normalized = String(countryScope ?? "").trim().toUpperCase();
  const codes = {
    RDC: "CD",
    "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO": "CD",
    "REPUBLIQUE DEMOCRATIQUE DU CONGO": "CD",
    BURUNDI: "BI",
    BI: "BI",
    CONGO: "CG",
    CG: "CG",
    SENEGAL: "SN",
    "SÉNÉGAL": "SN",
    SN: "SN",
  };
  return codes[normalized] ?? (/^[A-Z]{2}$/.test(normalized) ? normalized : "");
}

function requireAuth(req, _res, next) {
  try {
    const header = req.get("authorization") ?? "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1] ?? req.query.access_token;

    if (!token) {
      throw new BusinessError(401, "Authentification JWT requise");
    }

    req.principal = tokenService.verify(token, "access");
    next();
  } catch (error) {
    next(error instanceof BusinessError ? error : new BusinessError(401, error.message));
  }
}

function requirePermission(routeKey) {
  return (req, _res, next) => {
    if (!rbacService.canAccess(req.principal, routeKey)) {
      return next(new BusinessError(403, "Permission insuffisante pour cette fonctionnalité."));
    }

    next();
  };
}

function sendList(res, rows, query, searchableFields) {
  const wantsPagination = ["page", "limit", "sort", "search"].some((key) => query[key] !== undefined);

  if (!wantsPagination) {
    return res.json(rows);
  }

  return res.json(paginationService.paginate(rows, query, searchableFields));
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

function buildCorsOptions() {
  const rawOrigins = process.env.CORS_ORIGINS ?? "*";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.includes("*")) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new BusinessError(403, "Origine CORS non autorisée"));
    },
  };
}

function appSecurityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

app.use((error, _req, res, _next) => {
  if (error.statusCode) {
    if (error.statusCode >= 500) {
      console.error(error);
    }
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  res.status(500).json({
    message: "Erreur interne Somafrik",
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

initRepository()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
      console.log(`Base active: ${repository.engine ?? "postgresql"}`);
    });
  })
  .catch((error) => {
    console.error("Impossible d'initialiser le stockage Somafrik", error);
    process.exit(1);
  });

async function initRepository() {
  warnIfUnsafeConfiguration();

  try {
    repository.engine = "postgresql";
    await repository.init();
  } catch (error) {
    if (process.env.SOMAFRIK_DB_REQUIRED === "true") {
      throw error;
    }

    console.warn("PostgreSQL indisponible, démarrage en mode démo mémoire.");
    console.warn(`Cause: ${error.code ?? error.message}`);
    repository = new FallbackRepository();
    auditService = new AuditService(repository);
    await repository.init();
  }
}

function warnIfUnsafeConfiguration() {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET est obligatoire en production.");
  }

  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET non défini: utilisation du secret de développement.");
  }
}

function buildDatabaseUrl() {
  const user = encodeURIComponent(process.env.POSTGRES_USER ?? "somafrik");
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "somafrik123");
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = encodeURIComponent(process.env.POSTGRES_DB ?? "somafrik");
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
