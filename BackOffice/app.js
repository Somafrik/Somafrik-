const API_BASE_URL = "/api";

const state = {
  session: null,
  schools: [],
  users: [],
  countries: [],
  subscriptions: [],
  notifications: [],
  auditLog: [],
  schoolPage: 1,
  pageSize: 10,
};

const loginPanel = document.querySelector("#loginPanel");
const appPanel = document.querySelector("#appPanel");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const loginSchoolCodeInput = document.querySelector("#loginSchoolCodeInput");
const loginSchoolLogo = document.querySelector("#loginSchoolLogo");
const loginSchoolName = document.querySelector("#loginSchoolName");
const loginSchoolMeta = document.querySelector("#loginSchoolMeta");
const identifierInput = document.querySelector("#identifierInput");
const passwordInput = document.querySelector("#passwordInput");
const logoutButton = document.querySelector("#logoutButton");
const pageTitle = document.querySelector("#pageTitle");
const scopeLabel = document.querySelector("#scopeLabel");
const userName = document.querySelector("#userName");
const userRole = document.querySelector("#userRole");
const userInitials = document.querySelector("#userInitials");
const kpiGrid = document.querySelector("#kpiGrid");
const controlGrid = document.querySelector("#controlGrid");
const controlHint = document.querySelector("#controlHint");
const schoolsTable = document.querySelector("#schoolsTable");
const usersTable = document.querySelector("#usersTable");
const countriesTable = document.querySelector("#countriesTable");
const subscriptionsTable = document.querySelector("#subscriptionsTable");
const notificationsList = document.querySelector("#notificationsList");
const countryCount = document.querySelector("#countryCount");
const subscriptionCount = document.querySelector("#subscriptionCount");
const notificationCount = document.querySelector("#notificationCount");
const coverageSummary = document.querySelector("#coverageSummary");
const coverageGrid = document.querySelector("#coverageGrid");
const roadmapList = document.querySelector("#roadmapList");
const permissionsList = document.querySelector("#permissionsList");
const permissionCount = document.querySelector("#permissionCount");
const schoolSearch = document.querySelector("#schoolSearch");
const schoolCountryFilter = document.querySelector("#schoolCountryFilter");
const schoolTypeFilter = document.querySelector("#schoolTypeFilter");
const schoolStatusFilter = document.querySelector("#schoolStatusFilter");
const schoolsPager = document.querySelector("#schoolsPager");
const userSearch = document.querySelector("#userSearch");
const toastMessage = document.querySelector("#toastMessage");
const detailDrawer = document.querySelector("#detailDrawer");
const detailEyebrow = document.querySelector("#detailEyebrow");
const detailTitle = document.querySelector("#detailTitle");
const detailBody = document.querySelector("#detailBody");
const schoolModal = document.querySelector("#schoolModal");
const schoolForm = document.querySelector("#schoolForm");
const schoolFormMode = document.querySelector("#schoolFormMode");
const schoolFormTitle = document.querySelector("#schoolFormTitle");
const schoolFormError = document.querySelector("#schoolFormError");
const schoolOriginalCode = document.querySelector("#schoolOriginalCode");
const schoolNameInput = document.querySelector("#schoolNameInput");
const schoolCodeInput = document.querySelector("#schoolCodeInput");
const schoolTypeInput = document.querySelector("#schoolTypeInput");
const schoolCountryInput = document.querySelector("#schoolCountryInput");
const schoolCityInput = document.querySelector("#schoolCityInput");
const schoolStatusInput = document.querySelector("#schoolStatusInput");
const schoolPhoneInput = document.querySelector("#schoolPhoneInput");
const schoolEmailInput = document.querySelector("#schoolEmailInput");
const schoolPlanInput = document.querySelector("#schoolPlanInput");
const schoolEndDateInput = document.querySelector("#schoolEndDateInput");
const schoolMaxStudentsInput = document.querySelector("#schoolMaxStudentsInput");
const schoolMaxTeachersInput = document.querySelector("#schoolMaxTeachersInput");
const schoolAddressInput = document.querySelector("#schoolAddressInput");
const schoolLogoInput = document.querySelector("#schoolLogoInput");

const mvpCoverage = [
  ["Authentification par établissement", "Web / Mobile", "Couvert", "P0", "Code établissement, logo/nom école, rôle détecté, mot de passe et blocage comptes suspendus."],
  ["Établissements SaaS", "BackOffice", "Couvert", "P0", "Création, fiche, modification, suspension, paramètres, abonnement et code unique."],
  ["Utilisateurs et permissions", "BackOffice / Mobile", "Couvert", "P0", "Rôles MVP, statuts, permissions automatiques et réinitialisation mot de passe."],
  ["Élèves", "Web / Mobile", "Couvert", "P0", "Matricule, parent associé, dossier élève, statut actif/archivé et séparation des dossiers."],
  ["Classes et enseignants", "Web / Mobile", "Couvert", "P0", "Effectifs calculés, affectation élèves/enseignants et vue limitée aux classes de l'enseignant."],
  ["Présences et appels", "Web / Mobile", "Couvert", "P0", "Présent par défaut, absent/retard/justifié, sauvegarde en une action, audit et notification parent."],
  ["Notes simples", "Web / Mobile", "Couvert", "P0", "Évaluations, saisie par classe, contrôle barème, moyennes, classement et publication."],
  ["Paiements scolaires", "Web / Mobile", "Couvert", "P0", "Frais, encaissements, reste à payer, impayés, historique et notification paiement."],
  ["Notifications", "Web / Mobile", "Couvert", "P1", "Création, ciblage MVP, historique et notifications automatiques absence/paiement/note."],
  ["Dashboards", "Web / Mobile", "Couvert", "P1", "KPIs école, pays et plateforme avec filtrage par périmètre."],
  ["Super Admin / Admin Pays", "BackOffice", "Couvert", "P1", "Pays, administrateurs pays, validation écoles, suspension et statistiques."],
  ["Séparation de données", "SaaS", "Couvert", "P0", "École, pays, parent, enseignant et élève restent dans leur périmètre."],
].map(([module, scope, status, priority, detail]) => ({ module, scope, status, priority, detail }));

document.querySelectorAll("[data-demo]").forEach((button) => {
  button.addEventListener("click", () => {
    loginSchoolCodeInput.value = "CD-2026-0001";
    identifierInput.value = button.dataset.demo;
    passwordInput.value = "1234";
    loginForm.requestSubmit();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showView(button.dataset.view);
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  try {
    const payload = {
      schoolCode: loginSchoolCodeInput.value.trim(),
      identifier: identifierInput.value.trim(),
      password: passwordInput.value.trim(),
    };
    const response = await request("/backoffice/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.session = response;
    state.schools = response.schools;
    state.users = response.users;
    state.countries = response.countries ?? [];
    state.subscriptions = response.subscriptions ?? [];
    state.notifications = response.notifications ?? [];
    state.auditLog = response.auditLog ?? [];
    localStorage.setItem("schoollink-backoffice-session", JSON.stringify(response));
    renderApp();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("schoollink-backoffice-session");
  state.session = null;
  state.schools = [];
  state.users = [];
  state.countries = [];
  state.subscriptions = [];
  state.notifications = [];
  state.auditLog = [];
  loginPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
});

schoolSearch.addEventListener("input", () => {
  state.schoolPage = 1;
  renderSchools();
});

loginSchoolCodeInput.addEventListener("blur", () => refreshLoginSchoolPreview());
loginSchoolCodeInput.addEventListener("change", () => refreshLoginSchoolPreview());
schoolCountryFilter.addEventListener("change", () => {
  state.schoolPage = 1;
  renderSchools();
});
schoolTypeFilter.addEventListener("change", () => {
  state.schoolPage = 1;
  renderSchools();
});
schoolStatusFilter.addEventListener("change", () => {
  state.schoolPage = 1;
  renderSchools();
});
schoolForm.addEventListener("submit", handleSchoolFormSubmit);
userSearch.addEventListener("input", () => renderUsers());
document.addEventListener("click", handleActionClick);

boot();
refreshLoginSchoolPreview();

function boot() {
  const saved = localStorage.getItem("schoollink-backoffice-session");

  if (!saved) {
    return;
  }

  try {
    const session = JSON.parse(saved);
    state.session = session;
    state.schools = session.schools ?? [];
    state.users = session.users ?? [];
    state.countries = session.countries ?? [];
    state.subscriptions = session.subscriptions ?? [];
    state.notifications = session.notifications ?? [];
    state.auditLog = session.auditLog ?? [];
    renderApp();
  } catch {
    localStorage.removeItem("schoollink-backoffice-session");
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Erreur BackOffice");
  }

  return data;
}

function renderApp() {
  const { user, scope } = state.session;
  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  userName.textContent = `${user.firstName} ${user.lastName}`;
  userRole.textContent = user.role;
  userInitials.textContent = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  scopeLabel.textContent = scope.label;
  controlHint.textContent = scope.hint;

  renderKpis();
  renderMenus();
  renderControls();
  renderCountries();
  renderSchools();
  renderSubscriptions();
  renderNotifications();
  renderUsers();
  renderReports();
  renderPermissions();
  showView("overview");
}

async function refreshLoginSchoolPreview() {
  const schoolCode = loginSchoolCodeInput.value.trim();

  if (!schoolCode) {
    loginSchoolLogo.textContent = "SL";
    loginSchoolName.textContent = "Code établissement requis";
    loginSchoolMeta.textContent = "Saisissez le code de votre établissement";
    return;
  }

  try {
    const school = await request(`/schools/${encodeURIComponent(schoolCode)}`);
    renderLoginSchoolPreview(school);
  } catch (error) {
    loginSchoolLogo.textContent = "!";
    loginSchoolName.textContent = "Établissement introuvable";
    loginSchoolMeta.textContent = error.message;
  }
}

function renderLoginSchoolPreview(school) {
  const initials = String(school.name ?? "SL")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  loginSchoolLogo.innerHTML = school.logoUrl
    ? `<img src="${escapeHtml(school.logoUrl)}" alt="Logo ${escapeHtml(school.name)}">`
    : escapeHtml(initials || "SL");
  loginSchoolName.textContent = school.name;
  loginSchoolMeta.textContent = `${school.code} • ${school.city ?? ""} • ${school.status ?? "Statut non défini"}`;
}

function renderKpis() {
  const cards = state.session.dashboard?.kpis ?? [];

  kpiGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="kpi-card">
          <span>${card.label}</span>
          <strong>${formatMetric(card.value, card.suffix)}</strong>
        </article>
      `
    )
    .join("");
}

function renderMenus() {
  const allowedMenus = state.session.menus ?? [];
  const menuToView = {
    Dashboard: "overview",
    Pays: "countries",
    "Administrateurs Pays": "users",
    Établissements: "schools",
    Validations: "schools",
    Abonnements: "subscriptions",
    Paiements: "subscriptions",
    Support: "notifications",
    Rapports: "overview",
    "Conformité MVP": "reports",
    Paramètres: "permissions",
  };
  const allowedViews = new Set(["overview", "reports", "permissions"]);

  allowedMenus.forEach((menu) => {
    if (menuToView[menu]) {
      allowedViews.add(menuToView[menu]);
    }
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("hidden", !allowedViews.has(button.dataset.view));
  });
}

function renderControls() {
  const permissions = state.session.user.permissions ?? [];
  controlGrid.innerHTML = permissions
    .slice(0, 8)
    .map(
      (permission) => `
        <article class="control-card">
          <strong>${permission}</strong>
          <p>${getControlDescription(permission)}</p>
        </article>
      `
    )
    .join("");
}

function renderSchools() {
  const query = normalize(schoolSearch.value);
  const country = schoolCountryFilter.value;
  const type = schoolTypeFilter.value;
  const status = schoolStatusFilter.value;
  const rows = getFilteredSchools({ query, country, type, status });
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  state.schoolPage = Math.min(state.schoolPage, totalPages);
  const start = (state.schoolPage - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  renderSchoolFilters();
  schoolsTable.innerHTML = pageRows
    .map(
      (school) => `
        <tr>
          <td><strong>${school.name}</strong><br><small>${school.type}</small></td>
          <td>${school.code}</td>
          <td>${school.country}</td>
          <td>${school.city}</td>
          <td><span class="status">${school.status}</span></td>
          <td>${school.subscriptionPlan}<br><small>${school.subscriptionEndDate}</small></td>
          <td>
            <div class="row-actions">
              ${
                school.validationStatus === "En attente"
                  ? `<button class="icon-action" type="button" data-action="validate-school" data-id="${school.code}">Valider</button>`
                  : `<button class="icon-action" type="button" data-action="inspect-school" data-id="${school.code}">Voir</button>`
              }
              <button class="icon-action" type="button" data-action="edit-school" data-id="${school.code}">Modifier</button>
              <button class="icon-action ${school.status === "Suspendu" ? "" : "danger"}" type="button" data-action="toggle-school" data-id="${school.code}">
                ${school.status === "Suspendu" ? "Réactiver" : "Suspendre"}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
  renderSchoolsPager(rows.length, totalPages);
}

function getFilteredSchools({ query, country, type, status }) {
  return state.schools.filter((school) => {
    const matchesSearch =
      !query ||
      [school.name, school.code, school.country, school.city].some((value) => normalize(value).includes(query));
    const matchesCountry = !country || school.country === country;
    const matchesType = !type || school.type === type;
    const matchesStatus = !status || school.status === status;

    return matchesSearch && matchesCountry && matchesType && matchesStatus;
  });
}

function renderSchoolFilters() {
  renderSelectOptions(schoolCountryFilter, state.schools.map((school) => school.country), "Tous les pays");
  renderSelectOptions(schoolTypeFilter, state.schools.map((school) => school.type), "Tous les types");
  renderSelectOptions(schoolStatusFilter, state.schools.map((school) => school.status), "Tous les statuts");
}

function renderSelectOptions(select, values, emptyLabel) {
  const current = select.value;
  const options = [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  select.innerHTML = [`<option value="">${emptyLabel}</option>`, ...options.map((value) => `<option value="${value}">${value}</option>`)].join("");
  select.value = options.includes(current) ? current : "";
}

function renderSchoolsPager(totalRows, totalPages) {
  const from = totalRows === 0 ? 0 : (state.schoolPage - 1) * state.pageSize + 1;
  const to = Math.min(totalRows, state.schoolPage * state.pageSize);
  schoolsPager.innerHTML = `
    <span>${from}-${to} sur ${totalRows} établissement(s)</span>
    <div class="row-actions">
      <button class="icon-action" type="button" data-action="previous-school-page" ${state.schoolPage === 1 ? "disabled" : ""}>Précédent</button>
      <span class="priority">Page ${state.schoolPage}/${totalPages}</span>
      <button class="icon-action" type="button" data-action="next-school-page" ${state.schoolPage === totalPages ? "disabled" : ""}>Suivant</button>
    </div>
  `;
}

function renderCountries() {
  countryCount.textContent = `${state.countries.length} pays`;
  countriesTable.innerHTML = state.countries
    .map(
      (country) => `
        <tr>
          <td><strong>${country.name}</strong><br><small>Admin : ${country.administratorId || "À affecter"}</small></td>
          <td>${country.code}</td>
          <td>${country.phonePrefix}</td>
          <td>${country.currency}</td>
          <td>${country.timezone}</td>
          <td><span class="status ${getStatusClass(country.status)}">${country.status}</span></td>
          <td>
            <div class="row-actions">
              <button class="icon-action" type="button" data-action="assign-country-admin" data-id="${country.id}">Admin</button>
              <button class="icon-action ${country.status === "Suspendu" ? "" : "danger"}" type="button" data-action="toggle-country" data-id="${country.id}">
                ${country.status === "Suspendu" ? "Réactiver" : "Suspendre"}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderSubscriptions() {
  subscriptionCount.textContent = `${state.subscriptions.length} abonnement(s)`;
  subscriptionsTable.innerHTML = state.subscriptions
    .map(
      (subscription) => `
        <tr>
          <td><strong>${subscription.schoolCode}</strong><br><small>${subscription.status}</small></td>
          <td>${subscription.country}</td>
          <td>${subscription.plan}</td>
          <td>${subscription.monthlyPrice} ${subscription.currency}</td>
          <td>${subscription.endDate}</td>
          <td><span class="status ${getPaymentClass(subscription.paymentStatus)}">${subscription.paymentStatus}</span></td>
          <td>
            <div class="row-actions">
              <button class="icon-action" type="button" data-action="renew-subscription" data-id="${subscription.id}">Renouveler</button>
              <button class="icon-action" type="button" data-action="remind-subscription" data-id="${subscription.id}">Relancer</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderNotifications() {
  const unread = state.notifications.filter((notification) => notification.status === "Non lu").length;
  notificationCount.textContent = `${unread} non lue(s)`;
  notificationsList.innerHTML = state.notifications
    .map(
      (notification) => `
        <article class="notification-item">
          <div>
            <strong>${notification.title}</strong>
            <p>${notification.type} • ${notification.priority} • ${(notification.channels ?? []).join(", ")}</p>
            <p>${notification.message}</p>
          </div>
          <div class="row-actions">
            <span class="status ${notification.status === "Non lu" ? "status-warning" : ""}">${notification.status}</span>
            <button class="icon-action" type="button" data-action="read-notification" data-id="${notification.id}">Lu</button>
            <button class="icon-action danger" type="button" data-action="archive-notification" data-id="${notification.id}">Archiver</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderUsers() {
  const query = normalize(userSearch.value);
  const rows = state.users.filter((user) =>
    [user.firstName, user.lastName, user.identifier, user.role, user.countryScope, user.schoolCode].some((value) =>
      normalize(value).includes(query)
    )
  );

  usersTable.innerHTML = rows
    .map(
      (user) => `
        <tr>
          <td><strong>${user.firstName} ${user.lastName}</strong><br><small>${user.identifier}</small></td>
          <td>${user.role}</td>
          <td>${user.scopeLevel}${user.countryScope ? ` • ${user.countryScope}` : ""}</td>
          <td>${user.accessChannel}</td>
          <td><span class="status">${user.status}</span></td>
          <td>
            <div class="row-actions">
              <button class="icon-action" type="button" data-action="reset-user-password" data-id="${user.id}">Mot de passe</button>
              <button class="icon-action ${user.status === "Suspendu" ? "" : "danger"}" type="button" data-action="toggle-user" data-id="${user.id}">
                ${user.status === "Suspendu" ? "Réactiver" : "Suspendre"}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderPermissions() {
  const permissions = state.session.user.permissions ?? [];
  permissionCount.textContent = `${permissions.length} permission(s)`;
  permissionsList.innerHTML = permissions
    .map((permission) => `<div class="permission">${permission}</div>`)
    .join("");
}

function renderReports() {
  const covered = mvpCoverage.filter((item) => item.status === "Couvert").length;
  const partial = mvpCoverage.filter((item) => item.status === "Partiel").length;
  const missing = mvpCoverage.filter((item) => item.status === "Manquant").length;

  coverageSummary.textContent = `${covered} couvert • ${partial} partiel • ${missing} manquant`;
  coverageGrid.innerHTML = [
    { label: "Couvert", value: covered, className: "status-ok" },
    { label: "Partiel", value: partial, className: "status-warning" },
    { label: "Manquant", value: missing, className: "status-danger" },
    { label: "Modules suivis", value: mvpCoverage.length, className: "" },
  ]
    .map(
      (item) => `
        <article class="coverage-card">
          <span>${item.label}</span>
          <strong class="${item.className}">${item.value}</strong>
        </article>
      `
    )
    .join("");

  roadmapList.innerHTML = mvpCoverage
    .map(
      (item) => `
        <article class="roadmap-item">
          <div>
            <strong>${item.module}</strong>
            <p>${item.scope} • ${item.detail}</p>
          </div>
          <div class="row-actions">
            <span class="status ${getCoverageClass(item.status)}">${item.status}</span>
            <span class="priority">${item.priority}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function showView(viewName) {
  const titles = {
    overview: "Vue globale",
    countries: "Pays",
    schools: "Établissements",
    subscriptions: "Abonnements",
    notifications: "Notifications",
    users: "Utilisateurs",
    reports: "Rapports",
    permissions: "Permissions",
  };

  pageTitle.textContent = titles[viewName] ?? "BackOffice";
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  document.querySelector(`#${viewName}View`)?.classList.remove("hidden");
}

function handleActionClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const { action, id } = button.dataset;

  if (!action) return;

  if (action === "refresh-dashboard") {
    renderKpis();
    renderControls();
    showToast("Tableau de bord actualisé.");
    return;
  }

  if (action === "previous-school-page") {
    state.schoolPage = Math.max(1, state.schoolPage - 1);
    renderSchools();
    return;
  }

  if (action === "next-school-page") {
    state.schoolPage += 1;
    renderSchools();
    return;
  }

  if (action === "close-detail") {
    closeDetail();
    return;
  }

  if (action === "close-school-form") {
    closeSchoolForm();
    return;
  }

  if (action === "add-country") {
    const nextIndex = state.countries.length + 1;
    state.countries.unshift({
      id: `COUNTRY-TEST-${nextIndex}`,
      name: `Pays test ${nextIndex}`,
      code: `T${nextIndex}`,
      phonePrefix: "+000",
      currency: "USD",
      timezone: "Africa/Kinshasa",
      status: "Actif",
      administratorId: "",
      createdAt: formatDate(new Date()),
    });
    renderCountries();
    persistSession();
    showToast("Pays test créé.");
    return;
  }

  if (action === "assign-country-admin") {
    const target = id ? state.countries.find((country) => country.id === id) : state.countries.find((country) => !country.administratorId);
    if (!target) {
      showToast("Aucun pays sans administrateur à affecter.");
      return;
    }

    target.administratorId = target.administratorId || "USER-COUNTRY-RDC";
    renderCountries();
    persistSession();
    showToast(`Administrateur affecté à ${target.code}.`);
    return;
  }

  if (action === "toggle-country") {
    const target = state.countries.find((country) => country.id === id);
    if (!target) return;
    target.status = target.status === "Suspendu" ? "Actif" : "Suspendu";
    renderCountries();
    persistSession();
    showToast(`Pays ${target.status.toLowerCase()}.`);
    return;
  }

  if (action === "add-school") {
    openSchoolForm();
    return;
  }

  if (action === "edit-school") {
    const target = state.schools.find((school) => school.code === id);
    if (!target) return;
    openSchoolForm(target);
    return;
  }

  if (action === "validate-schools") {
    const count = state.schools.filter((school) => school.validationStatus === "En attente").length;
    state.schools.forEach((school) => {
      if (school.validationStatus === "En attente") {
        school.validationStatus = "Validé";
      }
    });
    renderSchools();
    persistSession();
    showToast(`${count} établissement(s) validé(s).`);
    return;
  }

  if (action === "validate-school") {
    const target = state.schools.find((school) => school.code === id);
    if (!target) return;
    target.validationStatus = "Validé";
    addAudit("Validation établissement", target.code, `${target.name} validé`);
    renderSchools();
    persistSession();
    showToast(`${target.name} validé.`);
    return;
  }

  if (action === "inspect-school") {
    const target = state.schools.find((school) => school.code === id);
    if (!target) return;
    openSchoolDetail(target);
    return;
  }

  if (action === "toggle-school") {
    const target = state.schools.find((school) => school.code === id);
    if (!target) return;
    target.status = target.status === "Suspendu" ? "Actif" : "Suspendu";
    addAudit("Changement statut établissement", target.code, `${target.name} passé à ${target.status}`);
    renderSchools();
    persistSession();
    showToast(`Établissement ${target.status.toLowerCase()}.`);
    return;
  }

  if (action === "renew-subscriptions") {
    state.subscriptions.forEach(renewSubscription);
    renderSubscriptions();
    persistSession();
    showToast("Tous les abonnements ont été renouvelés.");
    return;
  }

  if (action === "renew-subscription") {
    const target = state.subscriptions.find((subscription) => subscription.id === id);
    if (!target) return;
    renewSubscription(target);
    renderSubscriptions();
    persistSession();
    showToast(`Abonnement ${target.schoolCode} renouvelé.`);
    return;
  }

  if (action === "remind-subscriptions") {
    showToast("Relances envoyées aux établissements en retard.");
    return;
  }

  if (action === "remind-subscription") {
    const target = state.subscriptions.find((subscription) => subscription.id === id);
    if (!target) return;
    showToast(`Relance envoyée à ${target.schoolCode}.`);
    return;
  }

  if (action === "add-notification") {
    const nextIndex = state.notifications.length + 1;
    state.notifications.unshift({
      id: `NOTIF-TEST-${nextIndex}`,
      audience: state.session.user.role,
      countryCode: state.session.user.countryScope || "*",
      title: `Notification test ${nextIndex}`,
      message: "Notification créée depuis le BackOffice de test.",
      type: "Support",
      priority: "Moyenne",
      channels: ["Web", "Mobile"],
      status: "Non lu",
      date: formatDate(new Date()),
      createdBy: state.session.user.id,
    });
    renderNotifications();
    persistSession();
    showToast("Notification test créée.");
    return;
  }

  if (action === "read-all-notifications") {
    state.notifications.forEach((notification) => {
      notification.status = "Lu";
    });
    renderNotifications();
    persistSession();
    showToast("Toutes les notifications sont marquées comme lues.");
    return;
  }

  if (action === "read-notification") {
    const target = state.notifications.find((notification) => notification.id === id);
    if (!target) return;
    target.status = "Lu";
    renderNotifications();
    persistSession();
    showToast("Notification marquée comme lue.");
    return;
  }

  if (action === "archive-notification") {
    state.notifications = state.notifications.filter((notification) => notification.id !== id);
    renderNotifications();
    persistSession();
    showToast("Notification archivée.");
    return;
  }

  if (action === "add-user") {
    const nextIndex = state.users.length + 1;
    state.users.unshift({
      id: `USER-TEST-${nextIndex}`,
      publicId: `USR-TEST-${nextIndex}`,
      firstName: "Utilisateur",
      lastName: `Test ${nextIndex}`,
      identifier: `test-${nextIndex}`,
      role: "Admin School",
      scopeLevel: "Établissement",
      countryScope: "RDC",
      schoolCode: state.schools[0]?.code ?? "CD-2026-0001",
      accessChannel: "Application",
      status: "Actif",
      permissions: ["Voir tableau de bord"],
      temporaryPassword: "1234",
      history: [`Créé le ${formatDate(new Date())}`],
    });
    renderUsers();
    persistSession();
    showToast("Utilisateur test créé avec le mot de passe 1234.");
    return;
  }

  if (action === "reset-passwords") {
    state.users.forEach((user) => {
      user.temporaryPassword = "1234";
    });
    persistSession();
    showToast("Mots de passe temporaires réinitialisés à 1234.");
    return;
  }

  if (action === "reset-user-password") {
    const target = state.users.find((user) => user.id === id);
    if (!target) return;
    target.temporaryPassword = "1234";
    target.history = [...(target.history ?? []), `Mot de passe réinitialisé le ${formatDate(new Date())}`];
    persistSession();
    showToast(`Mot de passe de ${target.identifier} réinitialisé.`);
    return;
  }

  if (action === "toggle-user") {
    const target = state.users.find((user) => user.id === id);
    if (!target) return;
    target.status = target.status === "Suspendu" ? "Actif" : "Suspendu";
    renderUsers();
    persistSession();
    showToast(`Utilisateur ${target.status.toLowerCase()}.`);
    return;
  }

  if (action === "export-permissions") {
    const permissions = state.session.user.permissions ?? [];
    navigator.clipboard?.writeText(permissions.join("\n"));
    showToast("Permissions copiées dans le presse-papiers.");
    return;
  }

  if (action === "export-mvp-report") {
    const report = mvpCoverage
      .map((item) => `${item.priority} | ${item.status} | ${item.scope} | ${item.module} | ${item.detail}`)
      .join("\n");
    navigator.clipboard?.writeText(report);
    showToast("Rapport MVP copié dans le presse-papiers.");
  }
}

function renewSubscription(subscription) {
  subscription.status = "Actif";
  subscription.paymentStatus = "À jour";
  subscription.endDate = "31-08-2027";
  subscription.lastPaymentDate = formatDate(new Date());
}

function persistSession() {
  if (!state.session) return;

  state.session.schools = state.schools;
  state.session.users = state.users;
  state.session.countries = state.countries;
  state.session.subscriptions = state.subscriptions;
  state.session.notifications = state.notifications;
  state.session.auditLog = state.auditLog;
  localStorage.setItem("schoollink-backoffice-session", JSON.stringify(state.session));
}

function showToast(message) {
  toastMessage.textContent = message;
  toastMessage.classList.remove("hidden");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toastMessage.classList.add("hidden");
  }, 2600);
}

function openSchoolDetail(school) {
  const subscription = state.subscriptions.find((item) => item.schoolCode === school.code);
  const users = state.users.filter((user) => user.schoolCode === school.code);
  const auditRows = state.auditLog.filter((item) => item.targetId === school.code).slice(0, 8);

  detailEyebrow.textContent = `${school.type} • ${school.status}`;
  detailTitle.textContent = school.name;
  detailBody.innerHTML = `
    <div class="detail-grid">
      ${renderDetailItem("Code", school.code)}
      ${renderDetailItem("Pays", school.country)}
      ${renderDetailItem("Ville", school.city)}
      ${renderDetailItem("Validation", school.validationStatus ?? "Validé")}
      ${renderDetailItem("Téléphone", school.phone ?? "Non renseigné")}
      ${renderDetailItem("Email", school.email ?? "Non renseigné")}
      ${renderDetailItem("Devise", school.currency ?? "Non renseignée")}
      ${renderDetailItem("Fuseau", school.timezone ?? "Non renseigné")}
      ${renderDetailItem("Année scolaire", school.schoolYear ?? "2025-2026")}
      ${renderDetailItem("Abonnement", `${school.subscriptionPlan ?? subscription?.plan ?? "Non défini"} • ${subscription?.paymentStatus ?? school.subscriptionStatus ?? "À contrôler"}`)}
      ${renderDetailItem("Limite élèves", school.maxStudents ?? "Non définie")}
      ${renderDetailItem("Limite enseignants", school.maxTeachers ?? "Non définie")}
    </div>
    <div class="detail-section">
      <strong>Actions</strong>
      <div class="row-actions detail-actions">
        <button class="icon-action" type="button" data-action="edit-school" data-id="${school.code}">Modifier</button>
        <button class="icon-action ${school.status === "Suspendu" ? "" : "danger"}" type="button" data-action="toggle-school" data-id="${school.code}">
          ${school.status === "Suspendu" ? "Réactiver" : "Suspendre"}
        </button>
      </div>
    </div>
    <div class="detail-section">
      <strong>Utilisateurs liés</strong>
      <p>${users.length ? users.map((user) => `${user.firstName} ${user.lastName} (${user.role})`).slice(0, 6).join(", ") : "Aucun utilisateur directement rattaché."}</p>
    </div>
    <div class="detail-section">
      <strong>Audit récent</strong>
      ${
        auditRows.length
          ? `<div class="audit-list">${auditRows.map((item) => `<p><b>${item.date}</b> • ${item.action} • ${item.summary}</p>`).join("")}</div>`
          : "<p>Aucune action auditée sur cet établissement.</p>"
      }
    </div>
  `;
  detailDrawer.classList.remove("hidden");
}

function openSchoolForm(school = null) {
  schoolForm.reset();
  schoolFormError.textContent = "";
  schoolOriginalCode.value = school?.code ?? "";
  schoolFormMode.textContent = school ? "Modification" : "Création";
  schoolFormTitle.textContent = school ? "Modifier un établissement" : "Créer un établissement";
  schoolNameInput.value = school?.name ?? "";
  schoolCodeInput.value = school?.code ?? generateSchoolCode();
  schoolCodeInput.disabled = Boolean(school);
  schoolTypeInput.value = school?.type ?? "Lycée";
  schoolCountryInput.value = school?.country ?? state.session?.user?.countryScope ?? "RDC";
  schoolCityInput.value = school?.city ?? "";
  schoolStatusInput.value = school?.status ?? "Actif";
  schoolPhoneInput.value = school?.phone ?? "";
  schoolEmailInput.value = school?.email ?? "";
  schoolPlanInput.value = school?.subscriptionPlan ?? "Standard";
  schoolEndDateInput.value = school?.subscriptionEndDate ?? "31-08-2026";
  schoolMaxStudentsInput.value = school?.maxStudents ?? 500;
  schoolMaxTeachersInput.value = school?.maxTeachers ?? 50;
  schoolAddressInput.value = school?.address ?? "";
  schoolLogoInput.value = school?.logoUrl ?? "";
  schoolModal.classList.remove("hidden");
}

function closeSchoolForm() {
  schoolCodeInput.disabled = false;
  schoolModal.classList.add("hidden");
}

function handleSchoolFormSubmit(event) {
  event.preventDefault();
  const originalCode = schoolOriginalCode.value;
  const payload = readSchoolForm();
  const error = validateSchoolForm(payload, originalCode);

  if (error) {
    schoolFormError.textContent = error;
    return;
  }

  if (originalCode) {
    const index = state.schools.findIndex((school) => school.code === originalCode);
    if (index < 0) return;
    state.schools[index] = {
      ...state.schools[index],
      ...payload,
      publicId: originalCode,
      code: originalCode,
    };
    syncSchoolSubscription(state.schools[index]);
    addAudit("Modification établissement", originalCode, `${payload.name} mis à jour`);
    showToast("Établissement modifié.");
    openSchoolDetail(state.schools[index]);
  } else {
    const school = {
      ...payload,
      id: `SCHOOL-${Date.now()}`,
      publicId: payload.code,
      validationStatus: "En attente",
      subscriptionStartDate: formatDate(new Date()),
      schoolYear: "2025-2026",
      currency: "CDF",
      timezone: "Africa/Kinshasa",
      language: "Français",
      dateFormat: "JJ-MM-AAAA",
      primaryColor: "#2563EB",
      createdAt: formatDate(new Date()),
    };
    state.schools.unshift(school);
    syncSchoolSubscription(school);
    addAudit("Création établissement", school.code, `${school.name} créé`);
    state.schoolPage = 1;
    showToast("Établissement créé et mis en attente de validation.");
  }

  closeSchoolForm();
  renderSchools();
  renderKpis();
  renderSubscriptions();
  persistSession();
}

function readSchoolForm() {
  return {
    name: schoolNameInput.value.trim(),
    code: schoolCodeInput.value.trim().toUpperCase(),
    type: schoolTypeInput.value,
    country: schoolCountryInput.value.trim(),
    city: schoolCityInput.value.trim(),
    status: schoolStatusInput.value,
    phone: schoolPhoneInput.value.trim(),
    email: schoolEmailInput.value.trim(),
    subscriptionPlan: schoolPlanInput.value,
    subscriptionEndDate: schoolEndDateInput.value.trim(),
    maxStudents: Number(schoolMaxStudentsInput.value) || 0,
    maxTeachers: Number(schoolMaxTeachersInput.value) || 0,
    address: schoolAddressInput.value.trim(),
    logoUrl: schoolLogoInput.value.trim(),
  };
}

function validateSchoolForm(payload, originalCode) {
  if (!payload.name || !payload.code || !payload.type || !payload.country || !payload.city) {
    return "Nom, code, type, pays et ville sont obligatoires.";
  }

  const duplicate = state.schools.find((school) => school.code === payload.code && school.code !== originalCode);
  if (duplicate) {
    return "Ce code établissement existe déjà.";
  }

  if (payload.email && !payload.email.includes("@")) {
    return "L'email de l'établissement est invalide.";
  }

  if (payload.logoUrl && !/\.(jpg|jpeg|png|webp)$/i.test(payload.logoUrl)) {
    return "Le logo doit être une URL JPG, PNG ou WebP.";
  }

  if (payload.maxStudents < 1 || payload.maxTeachers < 1) {
    return "Les limites élèves et enseignants doivent être supérieures à zéro.";
  }

  return "";
}

function syncSchoolSubscription(school) {
  let subscription = state.subscriptions.find((item) => item.schoolCode === school.code);

  if (!subscription) {
    subscription = {
      id: `SUB-${school.code}`,
      schoolCode: school.code,
      countryCode: school.code.slice(0, 2),
      country: school.country,
      plan: school.subscriptionPlan,
      monthlyPrice: school.subscriptionPlan === "Premium" ? 120 : school.subscriptionPlan === "Standard" ? 90 : 60,
      annualPrice: school.subscriptionPlan === "Premium" ? 1200 : school.subscriptionPlan === "Standard" ? 900 : 600,
      currency: "USD",
      status: school.status,
      paymentStatus: "À jour",
      startDate: formatDate(new Date()),
      endDate: school.subscriptionEndDate,
      lastPaymentDate: formatDate(new Date()),
    };
    state.subscriptions.unshift(subscription);
  }

  subscription.country = school.country;
  subscription.plan = school.subscriptionPlan;
  subscription.status = school.status;
  subscription.endDate = school.subscriptionEndDate;
}

function addAudit(action, targetId, summary) {
  state.auditLog.unshift({
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toLocaleString("fr-FR"),
    actor: state.session?.user?.identifier ?? "system",
    action,
    targetId,
    summary,
  });
}

function generateSchoolCode() {
  const country = state.session?.user?.countryScope === "RDC" ? "CD" : "SL";
  const next = state.schools.length + 1;
  return `${country}-2026-${String(next).padStart(4, "0")}`;
}

function renderDetailItem(label, value) {
  return `
    <article class="detail-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function closeDetail() {
  detailDrawer.classList.add("hidden");
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getControlDescription(permission) {
  if (permission === "ALL_PRIVILEGES") return "Accès total à la plateforme SchoolLink.";
  if (permission === "COUNTRY_PRIVILEGES") return "Accès limité aux données du pays affecté.";
  if (permission.includes("pays")) return "Contrôle limité au périmètre pays autorisé.";
  if (permission.includes("établissement")) return "Contrôle des écoles, statuts et abonnements.";
  if (permission.includes("utilisateur") || permission.includes("admins")) return "Création, suspension et audit des comptes.";
  if (permission.includes("rapport")) return "Suivi des indicateurs consolidés.";
  if (permission.includes("abonnement")) return "Gestion des plans, échéances et limites.";
  return "Action autorisée selon votre niveau métier.";
}

function formatMetric(value, suffix) {
  return `${value}${suffix ? ` ${suffix}` : ""}`;
}

function getStatusClass(status) {
  return status === "Suspendu" ? "status-danger" : "";
}

function getPaymentClass(status) {
  return status === "En retard" ? "status-warning" : "";
}

function getCoverageClass(status) {
  if (status === "Manquant") return "status-danger";
  if (status === "Partiel") return "status-warning";
  return "";
}
