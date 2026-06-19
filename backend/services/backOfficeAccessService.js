const { BusinessError } = require("./authService");
const { CommunicationService } = require("./communicationService");
const { verifySecret } = require("./credentialService");

class BackOfficeAccessService {
  constructor({ school, schools = [school], userAccounts, countries = [], subscriptions = [], notifications = [] }) {
    this.school = school;
    this.schools = schools;
    this.userAccounts = userAccounts;
    this.countries = countries;
    this.subscriptions = subscriptions;
    this.notifications = notifications;
    this.communicationService = new CommunicationService({ notifications });
  }

  login({ schoolCode, identifier, password }) {
    if (!identifier || !password) {
      throw new BusinessError(400, "Identifiant et mot de passe obligatoires");
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const user = this.userAccounts.find((account) =>
      [account.identifier, account.phone, account.publicId].some(
        (value) => String(value ?? "").trim().toLowerCase() === normalizedIdentifier
      )
    );

    if (!user || !this.verifyPassword(user, password)) {
      throw new BusinessError(401, "Identifiants BackOffice incorrects");
    }

    if (user.status !== "Actif") {
      throw new BusinessError(403, "Compte suspendu ou desactive");
    }

    if (user.accessChannel !== "BackOffice" && !this.isBackOfficeRole(user)) {
      throw new BusinessError(403, "Ce compte n'a pas accès au BackOffice");
    }

    if (!this.isPlatformAdmin(user) && !String(schoolCode ?? "").trim()) {
      throw new BusinessError(400, "Code établissement obligatoire pour ce compte");
    }

    const schoolContext = this.resolveSchoolContext(schoolCode || this.getDefaultSchoolCodeForUser(user));
    this.assertScopeCanAccessSchool(user, schoolContext);

    const { password: _password, temporaryPassword: _temporaryPassword, ...safeUser } = user;

    return {
      user: safeUser,
      schoolContext,
      scope: this.getScope(user),
      menus: this.getMenus(user),
      dashboard: this.getDashboard(user),
      schools: this.getScopedSchools(user),
      users: this.getScopedUsers(user).map(({ password: _pwd, temporaryPassword: _tmp, ...account }) => account),
      countries: this.getScopedCountries(user),
      subscriptions: this.getScopedSubscriptions(user),
      notifications: this.getScopedNotifications(user),
      unreadNotifications: this.communicationService.getUnreadCount(this.getScopedNotifications(user)),
    };
  }

  verifyPassword(user, password) {
    if (user.passwordHash) {
      return verifySecret(password, user.passwordHash);
    }

    if (user.pinHash) {
      return verifySecret(password, user.pinHash);
    }

    return user.password === password;
  }

  isPlatformAdmin(user) {
    return user.role === "Super Administrateur OKAFRIK" || user.role === "Admin Pays";
  }

  isBackOfficeRole(user) {
    return [
      "Super Administrateur OKAFRIK",
      "Admin Pays",
      "Admin School",
      "Secrétaire",
      "Sécretaire",
      "Préfet des études",
    ].includes(user.role);
  }

  resolveSchoolContext(schoolCode) {
    const normalizedCode = String(schoolCode).trim().toUpperCase();
    const school = this.schools.find((item) =>
      [item.code, item.publicId].some(
        (value) => String(value ?? "").trim().toUpperCase() === normalizedCode
      )
    );

    if (!school) {
      throw new BusinessError(404, "Code établissement invalide");
    }

    if (school.status === "Suspendu") {
      throw new BusinessError(403, "Établissement suspendu. Connexion indisponible.");
    }

    return school;
  }

  getDefaultSchoolCodeForUser(user) {
    if (user.schoolCode && user.schoolCode !== "*") {
      return user.schoolCode;
    }

    if (user.countryScope) {
      const countryCode = this.getCountryCode(user.countryScope);
      const scopedSchool = this.schools.find((school) =>
        school.status !== "Suspendu" && (school.country === user.countryScope || school.code.startsWith(countryCode))
      );

      if (scopedSchool) {
        return scopedSchool.code;
      }
    }

    return this.schools.find((school) => school.status !== "Suspendu")?.code ?? this.school?.code;
  }

  assertScopeCanAccessSchool(user, school) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return;
    }

    if (user.role === "Admin Pays") {
      const countryCode = this.getCountryCode(user.countryScope);
      const allowed = school.country === user.countryScope || school.code.startsWith(countryCode);

      if (!allowed) {
        throw new BusinessError(403, "Cet administrateur pays ne peut accéder qu'à son pays.");
      }

      return;
    }

    if (user.schoolCode !== school.code) {
      throw new BusinessError(403, "Un établissement ne peut pas voir les données d'un autre établissement.");
    }
  }

  getScopedSchools(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return this.schools;
    }

    if (user.role === "Admin Pays") {
      return this.schools.filter((item) => item.country === user.countryScope || item.code.startsWith(this.getCountryCode(user.countryScope)));
    }

    return this.schools.filter((item) => item.code === user.schoolCode);
  }

  getScopedCountries(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return this.countries;
    }

    if (user.role === "Admin Pays") {
      return this.countries.filter((country) => country.code === this.getCountryCode(user.countryScope));
    }

    return this.countries.filter((country) => country.code === this.getCountryCode(user.countryScope));
  }

  getScopedSubscriptions(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return this.subscriptions;
    }

    if (user.role === "Admin Pays") {
      return this.subscriptions.filter((subscription) => subscription.countryCode === this.getCountryCode(user.countryScope));
    }

    return [];
  }

  getScopedNotifications(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return this.communicationService.enrichNotifications(this.notifications);
    }

    if (user.role === "Admin Pays") {
      const countryCode = this.getCountryCode(user.countryScope);
      return this.communicationService.filterByAudience("Admin Pays", countryCode);
    }

    return [];
  }

  getMenus(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return [
        "Dashboard",
        "Pays",
        "Administrateurs Pays",
        "Établissements",
        "Abonnements",
        "Paiements",
        "Support",
        "Rapports",
        "Paramètres",
      ];
    }

    if (user.role === "Admin Pays") {
      return ["Dashboard", "Établissements", "Validations", "Paiements", "Rapports", "Support", "Paramètres"];
    }

    if (user.role === "Admin School") {
      return ["Dashboard", "Utilisateurs", "Rapports", "Support", "Années Académiques"];
    }

    if (user.role === "Secrétaire" || user.role === "Sécretaire") {
      return ["Dashboard", "Utilisateurs", "Support", "Rapports"];
    }

    if (user.role === "Préfet des études") {
      return ["Dashboard", "Utilisateurs", "Rapports", "Années Académiques", "Support"];
    }

    return ["Dashboard"];
  }

  getDashboard(user) {
    const scopedSchools = this.getScopedSchools(user);
    const scopedSubscriptions = this.getScopedSubscriptions(user);
    const scopedUsers = this.getScopedUsers(user);
    const countryCount = this.getScopedCountries(user).length;
    const suspendedSchools = scopedSchools.filter((school) => school.status === "Suspendu").length;
    const expiredSubscriptions = scopedSubscriptions.filter(
      (subscription) => subscription.status === "Suspendu" || subscription.paymentStatus === "En retard"
    ).length;
    const monthlyRevenue = scopedSubscriptions.reduce((total, subscription) => total + Number(subscription.monthlyPrice || 0), 0);
    const annualRevenue = scopedSubscriptions.reduce((total, subscription) => total + Number(subscription.annualPrice || 0), 0);
    const schoolAdmins = scopedUsers.filter((account) => account.role === "Admin School").length;

    if (user.role === "Super Administrateur OKAFRIK") {
      return {
        profile: "Super Administrateur",
        privilegeLevel: "ALL_PRIVILEGES",
        kpis: [
          { label: "Pays", value: countryCount },
          { label: "Établissements", value: scopedSchools.length },
          { label: "Élèves", value: this.school.maxStudents ?? 0 },
          { label: "Enseignants", value: this.school.maxTeachers ?? 0 },
          { label: "Revenus mensuels", value: monthlyRevenue, suffix: "USD" },
          { label: "Revenus annuels", value: annualRevenue, suffix: "USD" },
          { label: "Établissements suspendus", value: suspendedSchools },
          { label: "Abonnements expirés", value: expiredSubscriptions },
        ],
      };
    }

    if (user.role === "Admin Pays") {
      return {
        profile: "Administrateur Pays",
        privilegeLevel: "COUNTRY_PRIVILEGES",
        kpis: [
          { label: "Établissements", value: scopedSchools.length },
          { label: "Élèves", value: this.school.maxStudents ?? 0 },
          { label: "Enseignants", value: this.school.maxTeachers ?? 0 },
          { label: "Taux de paiement", value: this.getPaymentRate(scopedSubscriptions), suffix: "%" },
          { label: "Nouveaux établissements", value: scopedSchools.filter((school) => school.validationStatus !== "Validé").length },
          { label: "Établissements suspendus", value: suspendedSchools },
          { label: "Admins écoles", value: schoolAdmins },
          { label: "Abonnements en retard", value: expiredSubscriptions },
        ],
      };
    }

    if (user.role === "Secrétaire" || user.role === "Sécretaire") {
      return {
        profile: "Secrétaire",
        privilegeLevel: "SCHOOL_INTERNAL",
        kpis: [
          { label: "Établissement", value: scopedSchools.length },
          { label: "Utilisateurs", value: scopedUsers.length },
          { label: "Dossiers élèves", value: scopedUsers.filter((account) => ["Élève / Étudiant", "Élève", "Étudiant"].includes(account.role)).length },
          { label: "Permissions", value: user.permissions?.length ?? 0 },
        ],
      };
    }

    if (user.role === "Préfet des études") {
      return {
        profile: "Préfet des études",
        privilegeLevel: "SCHOOL_PEDAGOGY",
        kpis: [
          { label: "Établissement", value: scopedSchools.length },
          { label: "Enseignants", value: scopedUsers.filter((account) => account.role === "Enseignant").length },
          { label: "Élèves", value: scopedUsers.filter((account) => ["Élève / Étudiant", "Élève", "Étudiant"].includes(account.role)).length },
          { label: "Permissions", value: user.permissions?.length ?? 0 },
        ],
      };
    }

    return {
      profile: "Administrateur École",
      privilegeLevel: "SCHOOL_PRIVILEGES",
      kpis: [
        { label: "Établissement", value: scopedSchools.length },
        { label: "Utilisateurs", value: scopedUsers.length },
        { label: "Permissions", value: user.permissions?.length ?? 0 },
      ],
    };
  }

  getScopedUsers(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return this.userAccounts;
    }

    if (user.role === "Admin Pays") {
      const countryCode = this.getCountryCode(user.countryScope);
      const scopedSchoolCodes = new Set(
        this.schools
          .filter((school) => school.country === user.countryScope || school.code.startsWith(countryCode))
          .map((school) => school.code)
      );
      return this.userAccounts.filter((account) =>
        account.role === "Admin School" &&
        (account.countryScope === user.countryScope || scopedSchoolCodes.has(account.schoolCode))
      );
    }

    return this.userAccounts.filter((account) => account.schoolCode === user.schoolCode);
  }

  getScope(user) {
    if (user.role === "Super Administrateur OKAFRIK") {
      return {
        label: "Périmètre global",
        hint: "Vous contrôlez tous les pays, établissements et comptes.",
      };
    }

    if (user.role === "Admin Pays") {
      return {
        label: `Périmètre pays : ${user.countryScope}`,
        hint: "Vous contrôlez uniquement les écoles et utilisateurs de ce pays.",
      };
    }

    return {
      label: `Périmètre établissement : ${user.schoolCode}`,
      hint: "Vous contrôlez uniquement votre établissement.",
    };
  }

  getCountryCode(countryScope) {
    const normalized = String(countryScope ?? "").trim().toUpperCase();
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

  getPaymentRate(subscriptions) {
    if (!subscriptions.length) {
      return 0;
    }

    const paid = subscriptions.filter((subscription) => subscription.paymentStatus === "À jour").length;
    return Math.round((paid / subscriptions.length) * 100);
  }
}

module.exports = { BackOfficeAccessService };
