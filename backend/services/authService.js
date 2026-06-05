const { AccountIdentifier } = require("./accountIdentifier");
const { verifySecret } = require("./credentialService");

const failedLoginAttempts = new Map();
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

const managedMobileRoles = {
  "Super Administrateur SchoolLink": { role: "super_admin", roleLabel: "Super Administrateur" },
  "Admin Pays": { role: "country_admin", roleLabel: "Admin Pays" },
  "Admin School": { role: "school_admin", roleLabel: "Admin Établissement" },
  Proviseur: { role: "principal", roleLabel: "Proviseur" },
  Directeur: { role: "principal", roleLabel: "Proviseur" },
  "Préfet des études": { role: "prefet", roleLabel: "Préfet des études" },
  Secrétaire: { role: "secretary", roleLabel: "Secrétaire" },
};

class BusinessError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

class AuthService {
  constructor({ school, teachers, students, userAccounts }) {
    this.school = school;
    this.teachers = teachers;
    this.students = students;
    this.userAccounts = userAccounts;
  }

  identify({ schoolCode, identifier }) {
    this.assertRequiredFields({ schoolCode, identifier }, "Champs manquants");
    this.assertSchoolCanConnect(schoolCode);

    const accountIdentifier = new AccountIdentifier(schoolCode, identifier);
    const managedUser = this.findManagedUser(identifier, schoolCode);

    this.assertManagedUserCanUseMobile(managedUser);

    const managedMobileRole = this.getManagedMobileRole(managedUser);
    if (managedMobileRole) {
      return managedMobileRole;
    }

    if (accountIdentifier.isAdmin()) {
      return { role: "school_admin", roleLabel: "Admin Établissement" };
    }

    if (this.findTeacher(accountIdentifier)) {
      return { role: "teacher", roleLabel: "Enseignant" };
    }

    if (this.findStudent(accountIdentifier)) {
      return { role: "student", roleLabel: "Élève" };
    }

    if (this.findParentStudents(accountIdentifier).length > 0) {
      return { role: "parent_student", roleLabel: "Parent" };
    }

    throw new BusinessError(404, "Aucun compte trouve pour cet identifiant");
  }

  login({ role, schoolCode, identifier, pin }) {
    this.assertRequiredFields({ role, schoolCode, identifier, pin }, "Champs manquants");
    this.assertSchoolCanConnect(schoolCode);

    const loginKey = this.getLoginAttemptKey(schoolCode, identifier);
    this.assertLoginNotLocked(loginKey);

    const accountIdentifier = new AccountIdentifier(schoolCode, identifier);
    const managedUser = this.findManagedUser(identifier, schoolCode);

    this.assertManagedUserCanUseMobile(managedUser);

    const managedMobileRole = this.getManagedMobileRole(managedUser);
    if (managedMobileRole?.role === role && this.verifyUserSecret(managedUser, pin)) {
      this.clearFailedLoginAttempts(loginKey);
      return {
        role,
        user: this.buildManagedMobileUser(managedUser),
        school: this.school,
      };
    }

    if (role === "teacher") {
      const teacher = this.findTeacher(accountIdentifier, pin);

      if (teacher) {
        const assignedClasses = [...new Set(teacher.assignments.map((item) => item.className))];
        const courses = [...new Set(teacher.assignments.map((item) => item.course))];
        const { password: _password, passwordHash: _passwordHash, pinHash: _pinHash, ...safeTeacher } = teacher;

        this.clearFailedLoginAttempts(loginKey);
        return {
          role,
          user: {
            ...safeTeacher,
            assignedClasses,
            courses,
          },
          school: this.school,
        };
      }
    }

    if (role === "student") {
      const student = this.findStudent(accountIdentifier, pin);

      if (student) {
        const { pin: _pin, pinHash: _pinHash, ...safeStudent } = student;
        this.clearFailedLoginAttempts(loginKey);
        return { role, user: safeStudent, school: this.school };
      }
    }

    if (role === "parent_student") {
      const matchedStudents = this.findParentStudents(accountIdentifier, pin);

      if (matchedStudents.length > 0) {
        const children = matchedStudents.map(({ pin: _pin, pinHash: _pinHash, ...safeStudent }) => safeStudent);
        const firstStudent = children[0];

        this.clearFailedLoginAttempts(loginKey);
        return {
          role,
          user: {
            id: `PARENT-${firstStudent.parentPhone}`,
            name: "Parent SchoolLink",
            parentPhone: firstStudent.parentPhone,
            children,
          },
          school: this.school,
        };
      }
    }

    this.recordFailedLoginAttempt(loginKey);
    throw new BusinessError(401, "Identifiants incorrects");
  }

  findTeacher(accountIdentifier, password) {
    return this.teachers.find(
      (teacher) =>
        (accountIdentifier.matches(teacher.id) ||
          accountIdentifier.matches(teacher.publicId) ||
          accountIdentifier.matches(teacher.phone)) &&
        (password === undefined || this.verifyUserSecret(teacher, password))
    );
  }

  findStudent(accountIdentifier, pin) {
    return this.students.find(
      (student) =>
        student.schoolCode === accountIdentifier.schoolCode &&
        (accountIdentifier.matches(student.matricule) || accountIdentifier.matches(student.publicId)) &&
        (pin === undefined || this.verifyUserSecret(student, pin))
    );
  }

  findParentStudents(accountIdentifier, pin) {
    return this.students.filter(
      (student) =>
        student.schoolCode === accountIdentifier.schoolCode &&
        accountIdentifier.matches(student.parentPhone) &&
        (pin === undefined || this.verifyUserSecret(student, pin))
    );
  }

  findManagedUser(identifier, schoolCode) {
    const normalizedSchoolCode = String(schoolCode).trim().toUpperCase();
    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    return this.userAccounts.find(
      (user) =>
        (user.schoolCode === "*" || user.schoolCode === normalizedSchoolCode) &&
        [user.identifier, user.email, user.phone, user.publicId].some(
          (value) => String(value ?? "").trim().toLowerCase() === normalizedIdentifier
        )
    );
  }

  buildManagedMobileUser(user) {
    return {
      id: user.id,
      publicId: user.publicId,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.identifier,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      scopeLevel: user.scopeLevel,
      countryScope: user.countryScope,
      countryCode: user.countryCode,
      schoolCode: user.schoolCode,
      permissions: user.permissions,
    };
  }

  getManagedMobileRole(user) {
    return user ? managedMobileRoles[user.role] : null;
  }

  assertRequiredFields(fields, message) {
    if (Object.values(fields).some((field) => !field)) {
      throw new BusinessError(400, message);
    }
  }

  assertSchoolCanConnect(schoolCode) {
    if (!this.matchesSchoolCode(schoolCode)) {
      throw new BusinessError(401, "Code etablissement invalide");
    }

    if (this.school.status === "Suspendu") {
      throw new BusinessError(403, "Etablissement suspendu. Connexion indisponible.");
    }
  }

  verifyUserSecret(user, secret) {
    if (!user) {
      return false;
    }

    if (user.passwordHash || user.pinHash) {
      return verifySecret(secret, user.passwordHash) || verifySecret(secret, user.pinHash);
    }

    return user.password === secret || user.pin === secret;
  }

  getLoginAttemptKey(schoolCode, identifier) {
    return `${String(schoolCode).trim().toUpperCase()}:${String(identifier).trim().toLowerCase()}`;
  }

  assertLoginNotLocked(key) {
    const current = failedLoginAttempts.get(key);

    if (!current?.lockedUntil) {
      return;
    }

    if (current.lockedUntil <= Date.now()) {
      failedLoginAttempts.delete(key);
      return;
    }

    throw new BusinessError(423, "Compte temporairement verrouille apres plusieurs tentatives. Reessayez dans 15 minutes.");
  }

  recordFailedLoginAttempt(key) {
    const current = failedLoginAttempts.get(key) ?? { count: 0, lockedUntil: null };
    const count = current.count + 1;
    failedLoginAttempts.set(key, {
      count,
      lockedUntil: count >= MAX_FAILED_LOGIN_ATTEMPTS ? Date.now() + LOGIN_LOCK_DURATION_MS : null,
    });
  }

  clearFailedLoginAttempts(key) {
    failedLoginAttempts.delete(key);
  }

  matchesSchoolCode(schoolCode) {
    const normalizedCode = String(schoolCode).trim().toUpperCase();
    return [this.school.code, this.school.publicId].some(
      (value) => String(value ?? "").trim().toUpperCase() === normalizedCode
    );
  }

  assertManagedUserCanUseMobile(user) {
    if (user && user.status !== "Actif") {
      throw new BusinessError(403, "Compte suspendu ou desactive. Connexion indisponible.");
    }

    if (
      user?.accessChannel === "BackOffice" &&
      !["Super Administrateur SchoolLink", "Admin Pays", "Admin School"].includes(user.role)
    ) {
      throw new BusinessError(
        403,
        "Ce compte est reserve au BackOffice SchoolLink. Utilisez le portail PC/tablette/web."
      );
    }
  }
}

module.exports = { AuthService, BusinessError };
