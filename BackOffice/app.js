const API_BASE_URL = "/api";

const state = {
  session: null,
  schools: [],
  users: [],
  countries: [],
  subscriptions: [],
  notifications: [],
};

const loginPanel = document.querySelector("#loginPanel");
const appPanel = document.querySelector("#appPanel");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
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
const permissionsList = document.querySelector("#permissionsList");
const permissionCount = document.querySelector("#permissionCount");
const schoolSearch = document.querySelector("#schoolSearch");
const userSearch = document.querySelector("#userSearch");

document.querySelectorAll("[data-demo]").forEach((button) => {
  button.addEventListener("click", () => {
    identifierInput.value = button.dataset.demo;
    passwordInput.value = "1234";
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
  loginPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
});

schoolSearch.addEventListener("input", () => renderSchools());
userSearch.addEventListener("input", () => renderUsers());

boot();

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
  renderPermissions();
  showView("overview");
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
    Paramètres: "permissions",
  };
  const allowedViews = new Set(["overview", "permissions"]);

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
  const rows = state.schools.filter((school) =>
    [school.name, school.code, school.country, school.city].some((value) => normalize(value).includes(query))
  );

  schoolsTable.innerHTML = rows
    .map(
      (school) => `
        <tr>
          <td><strong>${school.name}</strong><br><small>${school.type}</small></td>
          <td>${school.code}</td>
          <td>${school.country}</td>
          <td>${school.city}</td>
          <td><span class="status">${school.status}</span></td>
          <td>${school.subscriptionPlan}<br><small>${school.subscriptionEndDate}</small></td>
        </tr>
      `
    )
    .join("");
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
            <p>${notification.message}</p>
          </div>
          <span class="status ${notification.status === "Non lu" ? "status-warning" : ""}">${notification.status}</span>
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

function showView(viewName) {
  const titles = {
    overview: "Vue globale",
    countries: "Pays",
    schools: "Établissements",
    subscriptions: "Abonnements",
    notifications: "Notifications",
    users: "Utilisateurs",
    permissions: "Permissions",
  };

  pageTitle.textContent = titles[viewName] ?? "BackOffice";
  document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
  document.querySelector(`#${viewName}View`)?.classList.remove("hidden");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
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
