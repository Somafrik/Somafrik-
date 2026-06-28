import type { Country, School } from "../types";
import { schoolMatchesCountryScope } from "./format";
import { ALL_SCHOOLS_CODE } from "./activeSchool";

export function formatCountryOption(country: Country): { value: string; label: string } {
  return {
    value: country.code,
    label: `${country.code} — ${country.name}`,
  };
}

export function formatSchoolOption(school: School): { value: string; label: string } {
  return {
    value: school.code,
    label: `${school.code} — ${school.name}`,
  };
}

export const ALL_SCHOOLS_OPTION = {
  value: ALL_SCHOOLS_CODE,
  label: "Tous les établissements",
} as const;

/** Options de sélection établissement, avec entrée globale si plusieurs établissements. */
export function buildSchoolSelectOptions(
  schools: School[],
  options: { includeAll?: boolean } = {},
): Array<{ value: string; label: string }> {
  const includeAll = options.includeAll !== false && schools.length >= 2;
  return [
    ...(includeAll ? [ALL_SCHOOLS_OPTION] : []),
    ...schools.map(formatSchoolOption),
  ];
}

export function schoolsForCountry(schools: School[], countryCode: string): School[] {
  if (!countryCode) return [];
  return schools.filter((school) => schoolMatchesCountryScope(school, countryCode));
}
