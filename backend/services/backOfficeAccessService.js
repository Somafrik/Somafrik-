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
    if (!schoolCode || !identifier || !password) {
      throw new BusinessError(400, "Code établissement, identifiant et mot de passe obligatoires");
    }

    const user = this.userAccounts.find((account) =>
      [account.identifier, account.email, account.phone, account.publicId].some((value) => value === identifier)
    );

    if (!user || !this.verifyPassword(user, password)) {
      throw new BusinessError(401, "Identifiants BackOffice incorrects");
    }

    if (user.status !== "Actif") {
      throw new BusinessError(403, "Compte suspendu ou desactive");
    }

    if (user.accessChannel !== "BackOffice") {
      throw new BusinessError(403, "Ce compte n'a pas accès au BackOffice");
    }

    const schoolContext = this.resolveSchoolContext(schoolCode);
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

    return user.password === password;
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

  assertScopeCanAccessSchool(user, school) {
    if (user.role === "Super Administrateur SchoolLink") {
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
    if (user.role === "Super Administrateur SchoolLink") {
      return this.schools;
    }

    if (user.role === "Admin Pays") {
      return this.schools.filter((item) => item.country === user.countryScope || item.code.startsWith(this.getCountryCode(user.countryScope)));
    }

    return this.schools.filter((item) => item.code === user.schoolCode);
  }

  getScopedCountries(user) {
    if (user.role === "Super Administrateur SchoolLink") {
      return this.countries;
    }

    if (user.role === "Admin Pays") {
      return this.countries.filter((country) => country.code === this.getCountryCode(user.countryScope));
    }

    return this.countries.filter((country) => country.code === this.getCountryCode(user.countryScope));
  }

  getScopedSubscriptions(user) {
    if (user.role === "Super Administrateur SchoolLink") {
      return this.subscriptions;
    }

    if (user.role === "Admin Pays") {
      return this.subscriptions.filter((subscription) => subscription.countryCode === this.getCountryCode(user.countryScope));
    }

    return this.subscriptions.filter((subscription) => subscription.schoolCode === user.schoolCode);
  }

  getScopedNotifications(user) {
    if (user.role === "Super Administrateur SchoolLink") {
      return this.communicationService.enrichNotifications(this.notifications);
    }

    if (user.role === "Admin Pays") {
      const countryCode = this.getCountryCode(user.countryScope);
      return this.communicationService.filterByAudience("Admin Pays", countryCode);
    }

    return [];
  }

  getMenus(user) {
    if (user.role === "Super Administrateur SchoolLink") {
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

    return ["Dashboard", "Établissements", "Utilisateurs", "Paramètres"];
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

    if (user.role === "Super Administrateur SchoolLink") {
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

    return {
      profile: "Administrateur École",
      privilegeLevel: "SCHOOL_PRIVILEGES",
      kpis: [
        { label: "Établissements", value: scopedSchools.length },
        { label: "Utilisateurs", value: scopedUsers.length },
        { label: "Permissions", value: user.permissions?.length ?? 0 },
      ],
    };
  }

  getScopedUsers(user) {
    if (user.role === "Super Administrateur SchoolLink") {
      return this.userAccounts;
    }

    if (user.role === "Admin Pays") {
      return this.userAccounts.filter(
        (account) => account.countryScope === user.countryScope || account.schoolCode === "*"
      );
    }

    return this.userAccounts.filter((account) => account.schoolCode === user.schoolCode);
  }

  getScope(user) {
    if (user.role === "Super Administrateur SchoolLink") {
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
    if (countryScope === "RDC") {
      return "CD";
    }

    return String(countryScope ?? "").slice(0, 2).toUpperCase();
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
