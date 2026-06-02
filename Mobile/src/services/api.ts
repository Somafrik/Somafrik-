import { UserRole } from "../navigation/AppNavigator";

export const API_BASE_URL = "http://192.168.1.141:5001/api";

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
  const school = await request<SchoolInfo>("/school");

  if (school.code !== normalizedCode) {
    throw new Error("Code établissement invalide");
  }

  return school;
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

async function identifyAccountFromExistingEndpoints({
  schoolCode,
  identifier,
}: {
  schoolCode: string;
  identifier: string;
}): Promise<IdentifyResponse> {
  const normalizedIdentifier = identifier.trim();
  const normalizedSchoolCode = schoolCode.trim().toUpperCase();
  const possibleIdentifiers = getPossibleAccountIdentifiers(schoolCode, normalizedIdentifier);

  if (normalizedIdentifier.toLowerCase() === "admin") {
    return { role: "school_admin", roleLabel: "Administrateur" };
  }

  const [teachers, students] = await Promise.all([
    request<TeacherSummary[]>("/teachers"),
    request<StudentSummary[]>("/students"),
  ]);

  const teacher = teachers.find(
    (item) =>
      matchesAccountIdentifier(item.id, possibleIdentifiers) ||
      matchesAccountIdentifier(item.publicId, possibleIdentifiers) ||
      matchesAccountIdentifier(item.phone, possibleIdentifiers)
  );

  if (teacher) {
    return { role: "teacher", roleLabel: "Enseignant" };
  }

  const student = students.find(
    (item) =>
      item.schoolCode === normalizedSchoolCode &&
      (matchesAccountIdentifier(item.matricule, possibleIdentifiers) ||
        matchesAccountIdentifier(item.publicId, possibleIdentifiers))
  );

  if (student) {
    return { role: "student", roleLabel: "Élève" };
  }

  const parent = students.find(
    (item) => item.schoolCode === normalizedSchoolCode && matchesAccountIdentifier(item.parentPhone, possibleIdentifiers)
  );

  if (parent) {
    return { role: "parent_student", roleLabel: "Parent" };
  }

  throw new Error("Aucun compte trouvé pour cet identifiant");
}

function getPossibleAccountIdentifiers(schoolCode: string, identifier: string) {
  const normalizedSchoolCode = schoolCode.trim().toUpperCase();
  const normalizedIdentifier = identifier.trim();
  const upperIdentifier = normalizedIdentifier.toUpperCase();
  const values = new Set([normalizedIdentifier, upperIdentifier]);
  const localMatch = upperIdentifier.match(/^(ELE|ETU|ENS)-(\d+)$/);

  if (localMatch) {
    const [, profile, sequence] = localMatch;
    const normalizedSequence = String(Number(sequence)).padStart(4, "0");
    const extendedSequence = String(Number(sequence)).padStart(6, "0");
    const localIdentifier = `${profile}-${normalizedSequence}`;
    const extendedLocalIdentifier = `${profile}-${extendedSequence}`;

    values.add(localIdentifier);
    values.add(extendedLocalIdentifier);
    values.add(`${normalizedSchoolCode}-${upperIdentifier}`);
    values.add(`${normalizedSchoolCode}-${localIdentifier}`);
    values.add(`${normalizedSchoolCode}-${extendedLocalIdentifier}`);
  }

  return [...values];
}

function matchesAccountIdentifier(value: string | undefined, possibleIdentifiers: string[]) {
  const normalizedValue = String(value ?? "").trim().toUpperCase();

  if (!normalizedValue) {
    return false;
  }

  if (possibleIdentifiers.includes(normalizedValue) || possibleIdentifiers.includes(String(value).trim())) {
    return true;
  }

  const localMatch = normalizedValue.match(/(?:^|-)(ELE|ETU|ENS)-(\d+)$/);
  if (!localMatch) {
    return false;
  }

  const [, profile, sequence] = localMatch;
  const normalizedSequence = String(Number(sequence)).padStart(4, "0");
  const extendedSequence = String(Number(sequence)).padStart(6, "0");

  return (
    possibleIdentifiers.includes(`${profile}-${sequence}`) ||
    possibleIdentifiers.includes(`${profile}-${normalizedSequence}`) ||
    possibleIdentifiers.includes(`${profile}-${extendedSequence}`)
  );
}
