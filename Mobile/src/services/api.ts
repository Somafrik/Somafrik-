import { UserRole } from "../navigation/AppNavigator";
import { AuthResolver } from "../domain/auth/AuthResolver";
import { AccountIdentifier } from "../domain/auth/AccountIdentifier";
import {
  school as demoSchool,
  schools as demoSchools,
  students as demoStudents,
  teachers as demoTeachers,
  userAccounts as demoUsers,
} from "../data/catalog";

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const configuredApiUrl = process.env?.EXPO_PUBLIC_API_URL?.trim();
let accessToken: string | null = null;

export const API_BASE_URL = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, "")}/api`
  : "http://192.168.1.141:5000/api";

export type StudentSummary = {
  id: string;
  publicId?: string;
  name: string;
  firstName?: string;
  matricule: string;
  gender?: string;
  birthDate?: string;
  className: string;
  schoolCode: string;
  parentName?: string;
  parentPhone: string;
  parentEmail?: string;
  archived?: boolean;
};

export type TeacherAssignment = {
  className: string;
  course: string;
};

type LoginPayload = {
  role: UserRole;
  schoolCode: string;
  identifier: string;
  pin: string;
};

export type SchoolInfo = {
  id: string;
  publicId?: string;
  code: string;
  name: string;
  type?: string;
  city: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  slogan: string;
  status?: string;
  logoUrl?: string;
  schoolYear?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  primaryColor?: string;
  subscriptionPlan?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  maxStudents?: number;
  maxTeachers?: number;
};

export type IdentifyResponse = {
  role: UserRole;
  roleLabel: string;
};

export type LoginResponse = {
  role: UserRole;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  permissions?: string[];
  user: {
    id: string;
    publicId?: string;
    name: string;
    firstName?: string;
    lastName?: string;
    matricule?: string;
    className?: string;
    schoolCode?: string;
    scopeLevel?: string;
    countryScope?: string;
    countryCode?: string;
    permissions?: string[];
    parentPhone?: string;
    children?: StudentSummary[];
    phone?: string;
    assignments?: TeacherAssignment[];
    assignedClasses?: string[];
    courses?: string[];
  };
  school: SchoolInfo;
};

export type BackOfficeStatePayload = Record<string, unknown> & {
  schools?: unknown[];
  users?: unknown[];
  countries?: unknown[];
  subscriptions?: unknown[];
  notifications?: unknown[];
  students?: unknown[];
  teachers?: unknown[];
  classes?: unknown[];
  courses?: unknown[];
  assignments?: unknown[];
  payments?: unknown[];
  paymentStatuses?: unknown[];
  presences?: unknown[];
  notes?: unknown[];
  academicConfigs?: Record<string, unknown>;
  announcements?: unknown[];
  messages?: unknown[];
  rolePermissions?: Record<string, string[]>;
};

export type AcademicConfigPayload = {
  schoolCode: string;
  periodMode: string;
  periods: unknown[];
  evaluationTypes: string[];
  defaultScale: number;
  reportCardMode: string;
};

type TeacherSummary = {
  id: string;
  publicId?: string;
  phone: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "L'API SchoolLink ne répond pas correctement. Vérifiez que le backend est lancé sur le port 5000.");
  }

  if (!isJson) {
    throw new Error("Réponse API invalide. Vérifiez l'adresse API et redémarrez le backend.");
  }

  return data;
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => loginWithDemoData(payload)).then((session) => {
    accessToken = session.accessToken ?? null;
    return session;
  });
}

export async function logout() {
  try {
    await request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  } finally {
    accessToken = null;
  }
}

export async function getSchoolByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  try {
    return await request<SchoolInfo>(`/schools/${encodeURIComponent(normalizedCode)}`);
  } catch (error) {
    const school = getDemoSchoolByCode(normalizedCode);
    if (school) {
      return school;
    }

    throw error;
  }
}

export async function identifyAccount(payload: { schoolCode: string; identifier: string }) {
  try {
    return await request<IdentifyResponse>("/identify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return identifyAccountFromDemoData(payload);
  }
}

export function getHealth() {
  return request<{ status: string }>("/health");
}

export function getNotes() {
  return request<unknown[]>("/notes");
}

export function getStudents() {
  return request<StudentSummary[]>("/students");
}

export function getClasses() {
  return request<unknown[]>("/classes");
}

export function getCourses() {
  return request<unknown[]>("/courses");
}

export function getAcademicConfig() {
  return request<AcademicConfigPayload>("/academic-config");
}

export function saveAcademicConfig(payload: AcademicConfigPayload) {
  return request<AcademicConfigPayload>("/academic-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function saveNote(payload: unknown) {
  return request<unknown>("/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBackOfficeState() {
  return request<BackOfficeStatePayload>("/backoffice/state");
}

export function saveBackOfficeState(payload: BackOfficeStatePayload) {
  return request<BackOfficeStatePayload>("/backoffice/state", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(userId: string, temporaryPassword: string) {
  return request<{ temporaryPassword: string; user: unknown }>(`/users/${encodeURIComponent(userId)}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ temporaryPassword }),
  });
}

export function getReportCardPdfUrl(studentId: string, period = "Trimestre 1") {
  const tokenQuery = accessToken ? `&access_token=${encodeURIComponent(accessToken)}` : "";
  return `${API_BASE_URL}/students/${encodeURIComponent(studentId)}/report.pdf?period=${encodeURIComponent(period)}${tokenQuery}`;
}

async function identifyAccountFromExistingEndpoints({
  schoolCode,
  identifier,
}: {
  schoolCode: string;
  identifier: string;
}): Promise<IdentifyResponse> {
  const [teachers, students] = await Promise.all([
    request<TeacherSummary[]>("/teachers"),
    request<StudentSummary[]>("/students"),
  ]);
  const authResolver = new AuthResolver({ teachers, students });

  return authResolver.identify(schoolCode, identifier);
}

function getDemoSchoolByCode(code: string): SchoolInfo | null {
  const normalizedCode = code.trim().toUpperCase();
  const school = demoSchools.find((item) =>
    [item.code, item.publicId].some(
      (value) => String(value ?? "").trim().toUpperCase() === normalizedCode
    )
  ) ?? ([demoSchool.code, demoSchool.publicId].some((value) => String(value ?? "").trim().toUpperCase() === normalizedCode)
    ? demoSchool
    : null);

  if (!school) {
    return null;
  }

  return {
    id: school.id,
    publicId: school.publicId,
    code: school.code,
    name: school.name,
    type: school.type,
    city: school.city,
    country: school.country,
    address: school.address,
    phone: school.phone,
    email: school.email,
    website: school.website,
    currency: school.currency,
    slogan: school.slogan,
    status: school.status,
    logoUrl: school.logoUrl,
    schoolYear: school.schoolYear,
    timezone: school.timezone,
    language: school.language,
    dateFormat: school.dateFormat,
    primaryColor: school.primaryColor,
    subscriptionPlan: school.subscriptionPlan,
    subscriptionStartDate: school.subscriptionStartDate,
    subscriptionEndDate: school.subscriptionEndDate,
    maxStudents: school.maxStudents,
    maxTeachers: school.maxTeachers,
  };
}

function identifyAccountFromDemoData({
  schoolCode,
  identifier,
}: {
  schoolCode: string;
  identifier: string;
}): IdentifyResponse {
  const managedUser = findDemoUser(identifier, schoolCode);

  if (managedUser) {
    const role = mobileRoleFromLabel(managedUser.role);
    if (role) return role;
  }

  return new AuthResolver({
    teachers: demoTeachers,
    students: demoStudents,
  }).identify(schoolCode, identifier);
}

function findDemoUser(identifier: string, schoolCode: string) {
  const normalizedSchoolCode = schoolCode.trim().toUpperCase();
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return demoUsers.find(
    (user) =>
      (user.schoolCode === "*" || user.schoolCode === normalizedSchoolCode) &&
      [user.identifier, user.email, user.phone, user.publicId].some(
        (value) => String(value ?? "").trim().toLowerCase() === normalizedIdentifier
      )
  );
}

function mobileRoleFromLabel(role: string): IdentifyResponse | null {
  if (role === "Super Administrateur SchoolLink") return { role: "super_admin", roleLabel: "Super Administrateur" };
  if (role === "Admin Pays") return { role: "country_admin", roleLabel: "Admin Pays" };
  if (role === "Admin School") return { role: "school_admin", roleLabel: "Admin Établissement" };
  if (role === "Préfet des études") return { role: "prefet", roleLabel: "Préfet des études" };
  if (role === "Secrétaire") return { role: "secretary", roleLabel: "Secrétaire" };
  return null;
}

function loginWithDemoData({ role, schoolCode, identifier, pin }: LoginPayload): LoginResponse {
  if (pin !== "1234") {
    throw new Error("Identifiants incorrects");
  }

  const school = getDemoSchoolByCode(schoolCode);
  if (!school) {
    throw new Error("Code établissement invalide");
  }

  const managedUser = findDemoUser(identifier, schoolCode);
  const managedRole = managedUser ? mobileRoleFromLabel(managedUser.role) : null;

  if (managedUser && managedRole?.role === role) {
    return {
      role,
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      tokenType: "Bearer",
      expiresIn: 28800,
      permissions: managedUser.permissions,
      user: {
        id: managedUser.id,
        publicId: managedUser.publicId,
        name: `${managedUser.firstName ?? ""} ${managedUser.lastName ?? ""}`.trim() || managedUser.identifier,
        firstName: managedUser.firstName,
        lastName: managedUser.lastName,
        phone: managedUser.phone,
        schoolCode: managedUser.schoolCode,
        scopeLevel: managedUser.scopeLevel,
        countryScope: managedUser.countryScope,
        countryCode: managedUser.countryScope,
        permissions: managedUser.permissions,
      },
      school,
    };
  }

  const accountIdentifier = new AccountIdentifier(schoolCode, identifier);

  if (role === "teacher") {
    const teacher = demoTeachers.find(
      (item) =>
        accountIdentifier.matches(item.id) ||
        accountIdentifier.matches(item.publicId) ||
        accountIdentifier.matches(item.phone)
    );

    if (teacher) {
      const assignments = teacher.assignments ?? [];
      const assignedClasses = [...new Set(assignments.map((item) => item.className))];
      const courses = [...new Set(assignments.map((item) => item.course))];
      return {
        role,
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
        tokenType: "Bearer",
        expiresIn: 28800,
        permissions: demoUsers.find((user) => user.role === "Enseignant")?.permissions,
        user: { ...teacher, assignedClasses, courses },
        school,
      };
    }
  }

  if (role === "student") {
    const student = demoStudents.find(
      (item) =>
        item.schoolCode === accountIdentifier.schoolCode &&
        (accountIdentifier.matches(item.matricule) || accountIdentifier.matches(item.publicId))
    );

    if (student) {
      return {
        role,
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
        tokenType: "Bearer",
        expiresIn: 28800,
        permissions: demoUsers.find((user) => user.role === "Élève / Étudiant")?.permissions,
        user: student,
        school,
      };
    }
  }

  if (role === "parent_student") {
    const children = demoStudents.filter(
      (item) => item.schoolCode === accountIdentifier.schoolCode && accountIdentifier.matches(item.parentPhone)
    );

    if (children.length > 0) {
      const firstStudent = children[0];
      return {
        role,
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
        tokenType: "Bearer",
        expiresIn: 28800,
        permissions: demoUsers.find((user) => user.role === "Parent")?.permissions,
        user: {
          id: `PARENT-${firstStudent.parentPhone}`,
          name: "Parent SchoolLink",
          parentPhone: firstStudent.parentPhone,
          children,
        },
        school,
      };
    }
  }

  throw new Error("Identifiants incorrects");
}
