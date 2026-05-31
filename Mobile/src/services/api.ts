import { UserRole } from "../navigation/AppNavigator";

export const API_BASE_URL = "http://192.168.1.141:5001/api";

export type StudentSummary = {
  id: string;
  name: string;
  matricule: string;
  className: string;
  schoolCode: string;
  parentPhone: string;
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
  school: {
    id: string;
    code: string;
    name: string;
    city: string;
    slogan: string;
  };
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Une erreur est survenue");
  }

  return data;
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getHealth() {
  return request<{ status: string }>("/health");
}
