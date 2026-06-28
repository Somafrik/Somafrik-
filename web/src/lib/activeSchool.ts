import type { SessionUser } from "../types";
import { normalize } from "./format";

const STORAGE_KEY = "somafrik.activeSchoolCode";

/** Compte plateforme sans établissement fixe (Super Admin, Admin Pays). */
export function userRequiresSchoolSelection(user: SessionUser | null): boolean {
  if (!user) return false;
  return !user.schoolCode || user.schoolCode === "*";
}

export function readStoredSchoolCode(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeStoredSchoolCode(code: string): void {
  try {
    if (code) sessionStorage.setItem(STORAGE_KEY, code);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function pickInitialSchoolCode(
  user: SessionUser | null,
  availableCodes: string[],
): string {
  if (user?.schoolCode && user.schoolCode !== "*") {
    return user.schoolCode;
  }
  const stored = readStoredSchoolCode();
  if (stored && availableCodes.some((code) => normalize(code) === normalize(stored))) {
    return stored;
  }
  return availableCodes[0] ?? "";
}

/** Utilisateur avec périmètre limité à l'établissement actif (données + config). */
export function withSchoolScope(user: SessionUser | null, schoolCode: string): SessionUser | null {
  if (!user) return null;
  if (!userRequiresSchoolSelection(user)) return user;
  if (!schoolCode) return user;
  return { ...user, schoolCode };
}
