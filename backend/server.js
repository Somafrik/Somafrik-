require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
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
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://schoollink:schoollink123@localhost:5432/schoollink";
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
    name: "SchoolLink API",
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

app.get("/api/school", requireAuth, asyncHandler(async (_req, res) => {
  const { school } = await getRuntime();
  res.json(school);
}));

app.get("/api/classes", requireAuth, asyncHandler(async (req, res) => {
  const { classes, students, teachers, presences } = await getRuntime();
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

app.get("/api/students", requireAuth, asyncHandler(async (req, res) => {
  const { students } = await getRuntime();
  const { className } = req.query;
  const result = tenantScopeService.filterRows(students, req.principal)
    .filter((student) => !className || student.className === className)
    .map(({ pin, pinHash, ...student }) => student);

  sendList(res, result, req.query, ["name", "matricule", "className", "parentPhone"]);
}));

app.get("/api/students/:id", requireAuth, asyncHandler(async (req, res) => {
  const { students } = await getRuntime();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  const { pin, pinHash, ...safeStudent } = student;
  res.json(safeStudent);
}));

app.get("/api/students/:id/notes", requireAuth, asyncHandler(async (req, res) => {
  const { notes, students } = await getRuntime();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? notes.filter((note) => note.studentId === student.id) : []);
}));

app.get("/api/students/:id/report", requireAuth, asyncHandler(async (req, res) => {
  const { students, gradeBookService } = await getRuntime();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);

  if (!student) {
    return res.status(404).json({ message: "Eleve introuvable" });
  }

  res.json(gradeBookService.generateReport(student.id));
}));

app.get("/api/students/:id/report.pdf", requireAuth, asyncHandler(async (req, res) => {
  const { students, gradeBookService, reportPdfService } = await getRuntime();
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
  const { presences, students } = await getRuntime();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? presences.filter((presence) => presence.studentId === student.id) : []);
}));

app.get("/api/students/:id/payments", requireAuth, asyncHandler(async (req, res) => {
  const { payments, students } = await getRuntime();
  const student = findStudent(tenantScopeService.filterRows(students, req.principal), req.params.id);
  res.json(student ? payments.filter((payment) => payment.studentId === student.id) : []);
}));

app.get("/api/teachers", requireAuth, requirePermission("GET /api/teachers"), asyncHandler(async (req, res) => {
  const { teachers } = await getRuntime();
  const result = tenantScopeService.filterRows(teachers, req.principal).map(({ password, passwordHash, pinHash, ...teacher }) => ({
      ...teacher,
      assignedClasses: [...new Set(teacher.assignments.map((item) => item.className))],
      courses: [...new Set(teacher.assignments.map((item) => item.course))],
    }));
  sendList(res, result, req.query, ["name", "phone", "email", "mainSubject"]);
}));

app.get("/api/users", requireAuth, requirePermission("GET /api/users"), asyncHandler(async (req, res) => {
  const { userAccounts } = await getRuntime();
  const result = tenantScopeService.filterRows(userAccounts, req.principal).map(({ temporaryPassword, passwordHash, pinHash, ...user }) => ({
      ...user,
      hasTemporaryPassword: Boolean(temporaryPassword),
    }));
  sendList(res, result, req.query, ["firstName", "lastName", "identifier", "role", "schoolCode"]);
}));

app.get("/api/payments", requireAuth, requirePermission("GET /api/payments"), asyncHandler(async (req, res) => {
  const { payments, students } = await getRuntime();
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

app.get("/api/announcements", requireAuth, asyncHandler(async (_req, res) => {
  const { announcements } = await getRuntime();
  res.json(announcements);
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

app.get("/api/audit", requireAuth, asyncHandler(async (req, res) => {
  if (!["Super Administrateur SchoolLink", "Admin Pays"].includes(req.principal.role)) {
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

async function sendAuthenticatedResponse(req, res, response, action) {
  const principal = buildPrincipal(response);
  if (action === "backoffice_login" && ["Super Administrateur SchoolLink", "Admin Pays"].includes(principal.role)) {
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
  const schoolCode = user.schoolCode ?? school.code ?? "*";
  const countryCode = user.countryCode ?? school.countryCode ?? countryCodeFromSchoolOrCountry(schoolCode, school.country);

  return {
    sub: user.id ?? user.publicId ?? user.matricule ?? "anonymous",
    role,
    schoolCode,
    countryCode,
    permissions: user.permissions ?? rbacService.permissionsFor(role),
    studentIds: getPrincipalStudentIds(response),
    classNames: user.assignedClasses ?? [],
  };
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
  if (role === "super_admin") return "Super Administrateur SchoolLink";
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
  if (country === "RDC") return "CD";
  return String(schoolCode ?? "").slice(0, 2).toUpperCase();
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
    message: "Erreur interne SchoolLink",
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
    console.error("Impossible d'initialiser le stockage SchoolLink", error);
    process.exit(1);
  });

async function initRepository() {
  warnIfUnsafeConfiguration();

  try {
    repository.engine = "postgresql";
    await repository.init();
  } catch (error) {
    if (process.env.SCHOOLLINK_DB_REQUIRED === "true") {
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
