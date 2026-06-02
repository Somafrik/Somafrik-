const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  school,
  teachers,
  classes,
  students,
  notes,
  presences,
  payments,
  announcements,
  userAccounts,
} = require("./data");

const app = express();

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
      "/api/students/:id/presences",
      "/api/students/:id/payments",
      "/api/teachers",
      "/api/users",
      "/api/payments",
      "/api/announcements",
    ],
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/schools", (req, res) => {
  res.json([school]);
});

app.get("/api/schools/:code", (req, res) => {
  if (req.params.code.toUpperCase() !== school.code) {
    return res.status(404).json({ message: "Code etablissement invalide" });
  }

  res.json(school);
});

app.post("/api/backoffice/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifiant et mot de passe obligatoires" });
  }

  const user = userAccounts.find(
    (account) => account.identifier === identifier || account.phone === identifier
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Identifiants BackOffice incorrects" });
  }

  if (user.status !== "Actif") {
    return res.status(403).json({ message: "Compte suspendu ou desactive" });
  }

  if (user.accessChannel !== "BackOffice") {
    return res.status(403).json({ message: "Ce compte n'a pas accès au BackOffice" });
  }

  const scopedSchools = getScopedSchools(user);
  const scopedUsers = getScopedUsers(user);
  const { password: _password, temporaryPassword: _temporaryPassword, ...safeUser } = user;

  res.json({
    user: safeUser,
    scope: getBackOfficeScope(user),
    schools: scopedSchools,
    users: scopedUsers.map(({ password: _pwd, temporaryPassword: _tmp, ...account }) => account),
  });
});

app.post("/api/identify", (req, res) => {
  const { schoolCode, identifier } = req.body;

  if (!schoolCode || !identifier) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  if (String(schoolCode).toUpperCase() !== school.code) {
    return res.status(401).json({ message: "Code etablissement invalide" });
  }

  if (school.status === "Suspendu") {
    return res.status(403).json({ message: "Etablissement suspendu. Connexion indisponible." });
  }

  const managedUser = findManagedUser(identifier, schoolCode);

  if (managedUser && managedUser.status !== "Actif") {
    return res.status(403).json({ message: "Compte suspendu ou desactive. Connexion indisponible." });
  }

  if (managedUser?.accessChannel === "BackOffice") {
    return res.status(403).json({
      message: "Ce compte est reserve au BackOffice SchoolLink. Utilisez le portail PC/tablette/web.",
    });
  }

  if (identifier === "admin") {
    return res.json({ role: "school_admin", roleLabel: "Administrateur" });
  }

  const teacher = teachers.find(
    (item) => item.id === identifier || item.publicId === identifier || item.phone === identifier
  );

  if (teacher) {
    return res.json({ role: "teacher", roleLabel: "Enseignant" });
  }

  const studentByMatricule = students.find(
    (item) => item.schoolCode === schoolCode && item.matricule === identifier
  );

  if (studentByMatricule) {
    return res.json({ role: "student", roleLabel: "Élève" });
  }

  const parentStudent = students.find(
    (item) => item.schoolCode === schoolCode && item.parentPhone === identifier
  );

  if (parentStudent) {
    return res.json({ role: "parent_student", roleLabel: "Parent" });
  }

  return res.status(404).json({ message: "Aucun compte trouve pour cet identifiant" });
});

app.post("/api/login", (req, res) => {
  const { role, schoolCode, identifier, pin } = req.body;

  if (!role || !schoolCode || !identifier || !pin) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  if (String(schoolCode).toUpperCase() !== school.code) {
    return res.status(401).json({ message: "Code etablissement invalide" });
  }

  if (school.status === "Suspendu") {
    return res.status(403).json({ message: "Etablissement suspendu. Connexion indisponible." });
  }

  const managedUser = findManagedUser(identifier, schoolCode);

  if (managedUser && managedUser.status !== "Actif") {
    return res.status(403).json({ message: "Compte suspendu ou desactive. Connexion indisponible." });
  }

  if (managedUser?.accessChannel === "BackOffice") {
    return res.status(403).json({
      message: "Ce compte est reserve au BackOffice SchoolLink. Utilisez le portail PC/tablette/web.",
    });
  }

  if (role === "school_admin" && identifier === "admin" && pin === "1234") {
    return res.json({ role, user: { id: "ADMIN1", name: "Administrateur" }, school });
  }

  if (role === "teacher") {
    const teacher = teachers.find(
      (item) =>
        (item.id === identifier || item.publicId === identifier || item.phone === identifier) &&
        item.password === pin
    );

    if (teacher) {
      const assignedClasses = [...new Set(teacher.assignments.map((item) => item.className))];
      const courses = [...new Set(teacher.assignments.map((item) => item.course))];
      const { password: _password, ...safeTeacher } = teacher;

      return res.json({
        role,
        user: {
          ...safeTeacher,
          assignedClasses,
          courses,
        },
        school,
      });
    }
  }

  if (role === "student") {
    const student = students.find(
      (item) =>
        item.schoolCode === schoolCode &&
        item.matricule === identifier &&
        item.pin === pin
    );

    if (student) {
      const { pin: _pin, ...safeStudent } = student;
      return res.json({
        role,
        user: safeStudent,
        school,
      });
    }
  }

  if (role === "parent_student") {
    const matchedStudents = students.filter(
      (item) =>
        item.schoolCode === schoolCode &&
        item.parentPhone === identifier &&
        item.pin === pin
    );

    if (matchedStudents.length > 0) {
      const children = matchedStudents.map(({ pin: _pin, ...safeStudent }) => safeStudent);
      const firstStudent = children[0];

      return res.json({
        role,
        user: {
          id: `PARENT-${firstStudent.parentPhone}`,
          name: "Parent SchoolLink",
          parentPhone: firstStudent.parentPhone,
          children,
        },
        school,
      });
    }
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

function findManagedUser(identifier, schoolCode) {
  return userAccounts.find(
    (user) =>
      (user.schoolCode === "*" || user.schoolCode === String(schoolCode).toUpperCase()) &&
      (user.identifier === identifier || user.phone === identifier)
  );
}

function getScopedSchools(user) {
  if (user.role === "Super Administrateur SchoolLink") {
    return [school];
  }

  if (user.role === "Admin Pays") {
    return [school].filter((item) => item.country === user.countryScope);
  }

  return [school].filter((item) => item.code === user.schoolCode);
}

function getScopedUsers(user) {
  if (user.role === "Super Administrateur SchoolLink") {
    return userAccounts;
  }

  if (user.role === "Admin Pays") {
    return userAccounts.filter(
      (account) => account.countryScope === user.countryScope || account.schoolCode === "*"
    );
  }

  return userAccounts.filter((account) => account.schoolCode === user.schoolCode);
}

function getBackOfficeScope(user) {
  if (user.role === "Super Administrateur SchoolLink") {
    return {
      label: "Périmètre global",
      hint: "Vous contrôlez tous les pays, établissements et comptes.",
    };
  }

  if (user.role === "Admin Pays") {
    return {
      label: `Périmètre pays : ${user.countryScope}`,
      hint: "Vous contrôlez uniquement les écoles et utilisateurs de ce pays.",
    };
  }

  return {
    label: `Périmètre établissement : ${user.schoolCode}`,
    hint: "Vous contrôlez uniquement votre établissement.",
  };
}

const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur http://${HOST}:${PORT}`);
});
