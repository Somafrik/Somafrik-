import { Platform } from "react-native";
import { UserRole } from "../navigation/AppNavigator";

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
export const API_BASE_URL = `http://${API_HOST}:5001/api`;

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
