import { UserRole } from "../navigation/AppNavigator";
import { AuthResolver } from "../domain/auth/AuthResolver";

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const configuredApiUrl = process.env?.EXPO_PUBLIC_API_URL?.trim();

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
  user: {
    id: string;
    name: string;
    matricule?: string;
    className?: string;
    schoolCode?: string;
    parentPhone?: string;
    children?: StudentSummary[];
    phone?: string;
    assignments?: TeacherAssignment[];
    assignedClasses?: string[];
    courses?: string[];
  };
  school: SchoolInfo;
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
      ...options?.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "L'API SchoolLink ne répond pas correctement. Vérifiez que le backend est lancé sur le port 5001.");
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
  });
}

export async function getSchoolByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return request<SchoolInfo>(`/schools/${encodeURIComponent(normalizedCode)}`);
}

export async function identifyAccount(payload: { schoolCode: string; identifier: string }) {
  try {
    return await request<IdentifyResponse>("/identify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    return identifyAccountFromExistingEndpoints(payload);
  }
}

export function getHealth() {
  return request<{ status: string }>("/health");
}

export function getReportCardPdfUrl(studentId: string, period = "Trimestre 1") {
  return `${API_BASE_URL}/students/${encodeURIComponent(studentId)}/report.pdf?period=${encodeURIComponent(period)}`;
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
