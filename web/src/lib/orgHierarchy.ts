import type { Country, SessionUser } from "../types";
import { getCountryCodeFromScope, normalize } from "./format";

export const SUPER_ADMIN_ROLE = "Super Administrateur Somafrik";
/** Ancien libellé conservé pour compatibilité sessions / données persistées. */
export const LEGACY_SUPER_ADMIN_ROLE = "Super Administrateur OKAFRIK";

export const COUNTRY_ADMIN_ROLE = "Admin Pays";
export const SCHOOL_ADMIN_ROLE = "Admin School";

/**
 * Statut d'un compte créé mais non encore validé par le Super Admin.
 * Règle métier : un Admin École créé par un Admin Pays reste en attente de
 * validation par le Super Admin avant de devenir utilisable.
 */
export const PENDING_VALIDATION_STATUS = "En attente de validation";
export const VALIDATED_STATUS = "Validé";

export function isPendingValidationStatus(status?: string): boolean {
  const value = normalize(status);
  return value === "en attente de validation" || value === "en attente";
}

/** Établissement créé par Admin Pays, en attente de validation Super Admin. */
export function isSchoolAwaitingSuperadminValidation(school?: {
  validationStatus?: string;
  validationRequestedBy?: string;
}): boolean {
  if (!school) return false;
  const status = school.validationStatus;
  if (status === VALIDATED_STATUS || status === "Rejeté") return false;
  if (isPendingValidationStatus(status)) return true;
  return Boolean(school.validationRequestedBy);
}

export function normalizePlatformRole(role?: string): string {
  if (!role || role === LEGACY_SUPER_ADMIN_ROLE) return SUPER_ADMIN_ROLE;
  return role;
}

export function isSuperAdminRole(role?: string): boolean {
  return normalizePlatformRole(role) === SUPER_ADMIN_ROLE;
}

/** Rôles dont les droits CRUD sont pilotés par le Superadmin (page Droits par rôle). */
export const SUPERADMIN_MANAGED_ROLES = [COUNTRY_ADMIN_ROLE, SCHOOL_ADMIN_ROLE] as const;

export function isSuperadminManagedRole(role?: string): boolean {
  return SUPERADMIN_MANAGED_ROLES.includes(role as (typeof SUPERADMIN_MANAGED_ROLES)[number]);
}

/** Rôles plateforme hors périmètre du pilotage établissement local. */
export const PLATFORM_BACKOFFICE_ROLES = new Set<string>([
  SUPER_ADMIN_ROLE,
  LEGACY_SUPER_ADMIN_ROLE,
  COUNTRY_ADMIN_ROLE,
  SCHOOL_ADMIN_ROLE,
]);

export function isPlatformBackOfficeRole(role?: string): boolean {
  return PLATFORM_BACKOFFICE_ROLES.has(role ?? "");
}

/** Niveaux de la plateforme Somafrik (Pays → établissement). */
export const PLATFORM_LEVELS = [
  { key: "pays", label: "Pays" },
  { key: "local", label: "Local (établissement)" },
] as const;

export function scopedCountries(user: SessionUser | null, countries: Country[]): Country[] {
  if (!user) return [];
  const role = normalizePlatformRole(user.role);
  if (role === SUPER_ADMIN_ROLE) return countries;
  if (user.role === COUNTRY_ADMIN_ROLE) {
    return countries.filter(
      (country) =>
        normalize(country.name) === normalize(user.countryScope) ||
        normalize(country.code) === normalize(user.countryScope) ||
        getCountryCodeFromScope(user.countryScope) === country.code,
    );
  }
  return countries.filter(
    (country) =>
      normalize(country.code) === getCountryCodeFromScope(user.countryScope) ||
      normalize(country.name) === normalize(user.countryScope),
  );
}
