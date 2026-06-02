const { BusinessError } = require("./authService");

class BackOfficeAccessService {
  constructor({ school, userAccounts, countries = [], subscriptions = [], notifications = [] }) {
    this.school = school;
    this.userAccounts = userAccounts;
    this.countries = countries;
    this.subscriptions = subscriptions;
    this.notifications = notifications;
  }

  login({ identifier, password }) {
    if (!identifier || !password) {
      throw new BusinessError(400, "Identifiant et mot de passe obligatoires");
    }

    const user = this.userAccounts.find(
      (account) => account.identifier === identifier || account.phone === identifier
    );

    if (!user || user.password !== password) {
      throw new BusinessError(401, "Identifiants BackOffice incorrects");
    }

    if (user.status !== "Actif") {
      throw new BusinessError(403, "Compte suspendu ou desactive");
    }

    if (user.accessChannel !== "BackOffice") {
      throw new BusinessError(403, "Ce compte n'a pas accès au BackOffice");
    }

    const { password: _password, temporaryPassword: _temporaryPassword, ...safeUser } = user;

    return {
      user: safeUser,
      scope: this.getScope(user),
      menus: this.getMenus(user),
      dashboard: this.getDashboard(user),
      schools: this.getScopedSchools(user),
      users: this.getScopedUsers(user).map(({ password: _pwd, temporaryPassword: _tmp, ...account }) => account),
      countries: this.getScopedCountries(user),
      subscriptions: this.getScopedSubscriptions(user),
      notifications: this.getScopedNotifications(user),
    };
  }

  getScopedSchools(user) {
    if (user.role === "Super Administrateur SchoolLink") {
      return [this.school];
    }

    if (user.role === "Admin Pays") {
      return [this.school].filter((item) => item.country === user.countryScope);
    }

    return [this.school].filter((item) => item.code === user.schoolCode);
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
      return this.notifications.filter((notification) => notification.audience === "Super Administrateur SchoolLink");
    }

    if (user.role === "Admin Pays") {
      const countryCode = this.getCountryCode(user.countryScope);
      return this.notifications.filter(
        (notification) => notification.audience === "Admin Pays" && notification.countryCode === countryCode
      );
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
