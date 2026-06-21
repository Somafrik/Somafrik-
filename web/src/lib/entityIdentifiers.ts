const TEACHER_PROFILE = "ENS";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTeacherSequence(value: string, schoolCode: string): number | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return null;

  const fullPattern = new RegExp(`^${escapeRegExp(schoolCode)}-${TEACHER_PROFILE}-(\\d+)$`, "i");
  const fullMatch = fullPattern.exec(normalized);
  if (fullMatch?.[1]) return Number(fullMatch[1]);

  const shortPattern = new RegExp(`^${TEACHER_PROFILE}-(\\d+)$`, "i");
  const shortMatch = shortPattern.exec(normalized);
  if (shortMatch?.[1]) return Number(shortMatch[1]);

  return null;
}

function nextTeacherSequence(schoolCode: string, teachers: Record<string, unknown>[]): number {
  const normalizedSchool = schoolCode.trim().toUpperCase();
  let max = 0;

  for (const teacher of teachers) {
    const teacherSchool = String(teacher.schoolCode ?? "").trim().toUpperCase();
    if (teacherSchool && teacherSchool !== normalizedSchool) continue;

    for (const candidate of [teacher.publicId, teacher.identifier, teacher.matricule, teacher.id]) {
      const sequence = extractTeacherSequence(String(candidate ?? ""), normalizedSchool);
      if (sequence !== null) {
        max = Math.max(max, sequence);
      }
    }
  }

  return max + 1;
}

/** Identifiant court de connexion (ex. ENS-0001). */
export function getTeacherLoginIdentifier(publicIdOrIdentifier: string): string {
  const value = String(publicIdOrIdentifier ?? "").trim().toUpperCase();
  const match = value.match(/ENS-(\d+)$/i);
  if (!match?.[1]) return value;
  return `${TEACHER_PROFILE}-${String(Number(match[1])).padStart(4, "0")}`;
}

/** Identifiant complet : code_pays-année-n°_établissement-ENS-n° (ex. CD-2026-0001-ENS-0001). */
export function generateTeacherIdentifiers(
  schoolCode: string,
  teachers: Record<string, unknown>[] = [],
): { publicId: string; identifier: string } {
  const normalizedSchool = schoolCode.trim().toUpperCase();
  const sequence = nextTeacherSequence(normalizedSchool, teachers);
  const identifier = `${TEACHER_PROFILE}-${String(sequence).padStart(4, "0")}`;
  return {
    publicId: `${normalizedSchool}-${identifier}`,
    identifier,
  };
}

export function resolveTeacherIdentifiers(
  item: Record<string, unknown>,
  schoolCode: string,
  teachers: Record<string, unknown>[] = [],
): { publicId: string; identifier: string } {
  const normalizedSchool = schoolCode.trim().toUpperCase();
  const existingPublicId = String(item.publicId ?? "").trim();

  if (existingPublicId) {
    const loginId = getTeacherLoginIdentifier(existingPublicId);
    const hasFullPrefix = existingPublicId.toUpperCase().startsWith(`${normalizedSchool}-`);
    return {
      publicId: hasFullPrefix ? existingPublicId : `${normalizedSchool}-${loginId}`,
      identifier: String(item.identifier ?? loginId),
    };
  }

  return generateTeacherIdentifiers(normalizedSchool, teachers);
}
