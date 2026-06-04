const { AccountIdentifier } = require("./accountIdentifier");
const { verifySecret } = require("./credentialService");

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

    if (accountIdentifier.isAdmin()) {
      return { role: "school_admin", roleLabel: "Administrateur" };
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

    const accountIdentifier = new AccountIdentifier(schoolCode, identifier);
    const managedUser = this.findManagedUser(identifier, schoolCode);

    this.assertManagedUserCanUseMobile(managedUser);

    const adminUser = this.findManagedUser(identifier, schoolCode);
    if (role === "school_admin" && accountIdentifier.isAdmin() && this.verifyUserSecret(adminUser, pin)) {
      return { role, user: { id: "ADMIN1", name: "Administrateur" }, school: this.school };
    }

    if (role === "teacher") {
      const teacher = this.findTeacher(accountIdentifier, pin);

      if (teacher) {
        const assignedClasses = [...new Set(teacher.assignments.map((item) => item.className))];
        const courses = [...new Set(teacher.assignments.map((item) => item.course))];
        const { password: _password, passwordHash: _passwordHash, pinHash: _pinHash, ...safeTeacher } = teacher;

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
        return { role, user: safeStudent, school: this.school };
      }
    }

    if (role === "parent_student") {
      const matchedStudents = this.findParentStudents(accountIdentifier, pin);

      if (matchedStudents.length > 0) {
        const children = matchedStudents.map(({ pin: _pin, pinHash: _pinHash, ...safeStudent }) => safeStudent);
        const firstStudent = children[0];

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

    return this.userAccounts.find(
      (user) =>
        (user.schoolCode === "*" || user.schoolCode === normalizedSchoolCode) &&
        [user.identifier, user.email, user.phone, user.publicId].some((value) => value === identifier)
    );
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

    if (user?.accessChannel === "BackOffice") {
      throw new BusinessError(
        403,
        "Ce compte est reserve au BackOffice SchoolLink. Utilisez le portail PC/tablette/web."
      );
    }
  }
}

module.exports = { AuthService, BusinessError };
