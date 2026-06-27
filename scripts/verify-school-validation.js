/**
 * Vérifie la validation Super Admin des établissements créés par Admin Pays.
 *
 * Usage:
 *   node scripts/verify-school-validation.js
 */
const base = process.env.SOMAFRIK_API_URL ?? "http://127.0.0.1:5000/api";
const PENDING = "En attente de validation";
const VALIDATED = "Validé";

async function req(path, opts = {}) {
  const response = await fetch(`${base}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function login(identifier, password, schoolCode) {
  const result = await req("/backoffice/login", {
    method: "POST",
    body: { identifier, password, ...(schoolCode ? { schoolCode } : {}) },
  });
  if (result.status !== 200) {
    throw new Error(`Login ${identifier} -> ${result.status} ${JSON.stringify(result.data)}`);
  }
  return result.data.accessToken;
}

function row(label, ok, expected, actual) {
  console.log(`${ok ? "OK" : "FAIL"} | ${label} | attendu=${expected} | obtenu=${actual}`);
  return ok;
}

async function main() {
  const stamp = Date.now();
  const code = `CD-VAL-${stamp}`;
  const countryToken = await login("admin-rdc", "1234", "CD-2026-0001");
  const countryState = await req("/backoffice/state", { token: countryToken });
  const school = {
    code,
    name: `Ecole validation ${stamp}`,
    type: "Collège",
    country: "RDC",
    city: "Kinshasa",
    status: "Actif",
    validationStatus: VALIDATED,
  };

  await req("/backoffice/state", {
    method: "PUT",
    token: countryToken,
    body: { ...countryState.data, schools: [school, ...countryState.data.schools] },
  });

  const superToken = await login("superadmin", "1234");
  const afterCreate = await req("/backoffice/state", { token: superToken });
  const stored = afterCreate.data.schools.find((item) => item.code === code);

  let ok = true;
  ok =
    row(
      "Creation Admin Pays -> en attente",
      stored?.validationStatus === PENDING,
      PENDING,
      stored?.validationStatus,
    ) && ok;

  const blockedLogin = await req("/backoffice/login", {
    method: "POST",
    body: { identifier: "admin", password: "1234", schoolCode: code },
  });
  ok =
    row("Connexion sur ecole non validee", blockedLogin.status === 403, "403", String(blockedLogin.status)) &&
    ok;

  const superState = await req("/backoffice/state", { token: superToken });
  const validatedSchools = superState.data.schools.map((item) =>
    item.code === code
      ? {
          ...item,
          validationStatus: VALIDATED,
          validatedBy: "superadmin",
          validatedAt: new Date().toISOString(),
        }
      : item,
  );
  await req("/backoffice/state", {
    method: "PUT",
    token: superToken,
    body: { ...superState.data, schools: validatedSchools },
  });

  const afterValidate = await req("/backoffice/state", { token: superToken });
  const validated = afterValidate.data.schools.find((item) => item.code === code);
  ok =
    row(
      "Validation Super Admin",
      validated?.validationStatus === VALIDATED,
      VALIDATED,
      validated?.validationStatus,
    ) && ok;

  if (!ok) {
    process.exitCode = 1;
    console.error("Règle de validation établissement: ECHEC");
    return;
  }

  console.log("Règle de validation établissement: OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
