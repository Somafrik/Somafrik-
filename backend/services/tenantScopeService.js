const { BusinessError } = require("./authService");

class TenantScopeService {
  filterRows(rows, principal, { schoolField = "schoolCode", countryField = "countryCode" } = {}) {
    if (!principal || principal.role === "Super Administrateur OKAFRIK") {
      return rows;
    }

    const roleScoped = this.filterByRoleOwnership(rows, principal);

    if (principal.role === "Admin Pays") {
      return roleScoped.filter((row) => {
        const countryCode = row[countryField] ?? this.countryCodeFromCountry(row.country) ?? this.countryCodeFromSchool(row[schoolField]);
        return !countryCode || countryCode === principal.countryCode;
      });
    }

    return roleScoped.filter((row) => !row[schoolField] || row[schoolField] === principal.schoolCode);
  }

  filterByRoleOwnership(rows, principal) {
    const studentIds = new Set(principal.studentIds ?? []);
    const classNames = new Set(principal.classNames ?? []);

    if (principal.role === "Parent" || principal.role === "Élève / Étudiant") {
      if (!studentIds.size) {
        return [];
      }

      return rows.filter((row) => {
        if (row.studentId) return studentIds.has(row.studentId);
        if (row.id && row.matricule) return studentIds.has(row.id);
        if (row.className && !row.studentId && !row.matricule) return true;
        return !["student", "payment", "grade", "attendance"].includes(String(row.entityType ?? "").toLowerCase());
      });
    }

    if (principal.role === "Enseignant" && classNames.size) {
      return rows.filter((row) => {
        if (row.className) return classNames.has(row.className);
        if (row.name && row.level && row.track) return classNames.has(row.name);
        if (row.studentClassName) return classNames.has(row.studentClassName);
        return true;
      });
    }

    return rows;
  }

  assertSchoolAccess(principal, schoolCode) {
    if (!principal || principal.role === "Super Administrateur OKAFRIK") {
      return;
    }

    if (principal.role === "Admin Pays") {
      if (this.countryCodeFromSchool(schoolCode) === principal.countryCode) {
        return;
      }
      throw new BusinessError(403, "Accès refusé: pays hors périmètre.");
    }

    if (schoolCode && schoolCode !== principal.schoolCode) {
      throw new BusinessError(403, "Accès refusé: établissement hors périmètre.");
    }
  }

  countryCodeFromSchool(schoolCode) {
    return String(schoolCode ?? "").slice(0, 2).toUpperCase();
  }

  countryCodeFromCountry(country) {
    const normalized = String(country ?? "").trim().toUpperCase();
    const codes = {
      RDC: "CD",
      "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO": "CD",
      "REPUBLIQUE DEMOCRATIQUE DU CONGO": "CD",
      BURUNDI: "BI",
      BI: "BI",
      CONGO: "CG",
      CG: "CG",
      SENEGAL: "SN",
      "SÉNÉGAL": "SN",
      SN: "SN",
    };
    return codes[normalized] ?? (/^[A-Z]{2}$/.test(normalized) ? normalized : "");
  }
}

module.exports = { TenantScopeService };
