import type { UserRole } from "../../navigation/AppNavigator";
import type { IdentifyResponse, StudentSummary } from "../../services/api";
import { AccountIdentifier } from "./AccountIdentifier";

type TeacherSummary = {
  id: string;
  publicId?: string;
  phone: string;
};

type AuthResolverDirectory = {
  teachers: TeacherSummary[];
  students: StudentSummary[];
};

export class AuthResolver {
  constructor(private readonly directory: AuthResolverDirectory) {}

  identify(schoolCode: string, identifier: string): IdentifyResponse {
    const accountIdentifier = new AccountIdentifier(schoolCode, identifier);

    if (accountIdentifier.isAdmin()) {
      return this.toRole("school_admin", "Administrateur");
    }

    if (this.findTeacher(accountIdentifier)) {
      return this.toRole("teacher", "Enseignant");
    }

    if (this.findStudent(accountIdentifier)) {
      return this.toRole("student", "Élève");
    }

    if (this.findParentStudent(accountIdentifier)) {
      return this.toRole("parent_student", "Parent");
    }

    throw new Error("Aucun compte trouvé pour cet identifiant");
  }

  private findTeacher(accountIdentifier: AccountIdentifier) {
    return this.directory.teachers.find(
      (teacher) =>
        accountIdentifier.matches(teacher.id) ||
        accountIdentifier.matches(teacher.publicId) ||
        accountIdentifier.matches(teacher.phone)
    );
  }

  private findStudent(accountIdentifier: AccountIdentifier) {
    return this.directory.students.find(
      (student) =>
        student.schoolCode === accountIdentifier.schoolCode &&
        (accountIdentifier.matches(student.matricule) || accountIdentifier.matches(student.publicId))
    );
  }

  private findParentStudent(accountIdentifier: AccountIdentifier) {
    return this.directory.students.find(
      (student) => student.schoolCode === accountIdentifier.schoolCode && accountIdentifier.matches(student.parentPhone)
    );
  }

  private toRole(role: UserRole, roleLabel: string) {
    return { role, roleLabel };
  }
}
