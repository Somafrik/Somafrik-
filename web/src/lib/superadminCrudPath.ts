import type { Country, School } from "../types";
import { schoolMatchesCountryScope } from "./format";

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

export function schoolsForCountry(schools: School[], countryCode: string): School[] {
  if (!countryCode) return [];
  return schools.filter((school) => schoolMatchesCountryScope(school, countryCode));
}
