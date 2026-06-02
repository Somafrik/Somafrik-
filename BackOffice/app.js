const API_BASE_URL = "/api";

const state = {
  session: null,
  schools: [],
  users: [],
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
  renderControls();
  renderSchools();
  renderUsers();
  renderPermissions();
  showView("overview");
}

function renderKpis() {
  const activeSchools = state.schools.filter((school) => school.status === "Actif").length;
  const backOfficeUsers = state.users.filter((user) => user.accessChannel === "BackOffice").length;
  const appUsers = state.users.filter((user) => user.accessChannel === "Application").length;
  const countries = new Set(state.schools.map((school) => school.country).filter(Boolean)).size;

  const cards = [
    ["Pays", countries],
    ["Établissements actifs", activeSchools],
    ["Utilisateurs BackOffice", backOfficeUsers],
    ["Utilisateurs application", appUsers],
  ];

  kpiGrid.innerHTML = cards
    .map(([label, value]) => `<article class="kpi-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
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
    schools: "Établissements",
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
  if (permission.includes("pays")) return "Contrôle limité au périmètre pays autorisé.";
  if (permission.includes("établissement")) return "Contrôle des écoles, statuts et abonnements.";
  if (permission.includes("utilisateur") || permission.includes("admins")) return "Création, suspension et audit des comptes.";
  if (permission.includes("rapport")) return "Suivi des indicateurs consolidés.";
  if (permission.includes("abonnement")) return "Gestion des plans, échéances et limites.";
  return "Action autorisée selon votre niveau métier.";
}
