import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CRUD_ACTIONS } from "../lib/constants";
import {
  canManageRolePermissions,
  expandStoredPermissionsToGranular,
  getSuperadminManagedRoles,
  mergeSuperadminRolePermissions,
} from "../lib/permissions";
import {
  COUNTRY_ADMIN_ROLE,
  ROLE_GOVERNANCE_NOTES,
  SCHOOL_ADMIN_ROLE,
  getSuperadminPathModulesForRole,
  isModuleEnabledInDraft,
  isModuleFullyEnabledInDraft,
  normalizeManagedRolePermissions,
  resolveCountryAdminPermissions,
  setModuleEnabledInDraft,
  syncCountryAdminUsersWithPermissions,
  syncPlatformUsersWithRolePermissions,
  type CountryRolePermissions,
} from "../lib/roleGovernance";

import { SUPER_ADMIN_ROLE } from "../lib/orgHierarchy";

import {

  formatCountryOption,

  formatSchoolOption,

  schoolsForCountry,

} from "../lib/superadminCrudPath";

import { scopedCountries, scopedSchools } from "../lib/scope";

import { usePermissionContext } from "../lib/usePermissionContext";

import { Card, SectionHeader } from "../components/ui/Card";

import { Button } from "../components/ui/Button";

import { Field, Select } from "../components/ui/Field";

import { useToast } from "../components/ui/Toast";



type SuperadminDraftRole = typeof COUNTRY_ADMIN_ROLE | typeof SCHOOL_ADMIN_ROLE;



function cloneRolePermissionDrafts(rolePermissions: Record<string, string[]>) {
  const countryDraft = expandStoredPermissionsToGranular(
    COUNTRY_ADMIN_ROLE,
    rolePermissions[COUNTRY_ADMIN_ROLE] ?? [],
  );
  if (rolePermissions[COUNTRY_ADMIN_ROLE]?.includes("COUNTRY_PRIVILEGES")) {
    countryDraft.add("COUNTRY_PRIVILEGES");
  }

  return {
    [COUNTRY_ADMIN_ROLE]: countryDraft,
    [SCHOOL_ADMIN_ROLE]: expandStoredPermissionsToGranular(
      SCHOOL_ADMIN_ROLE,
      rolePermissions[SCHOOL_ADMIN_ROLE] ?? [],
    ),
  } as Record<SuperadminDraftRole, Set<string>>;
}



const ROLE_HINTS: Record<SuperadminDraftRole, string> = {
  [COUNTRY_ADMIN_ROLE]:
    "Socle pays (Pays, Établissements, Abonnements, Utilisateurs) + modules optionnels selon la politique du pays sélectionné.",
  [SCHOOL_ADMIN_ROLE]: "Périmètre établissement : scolarité, finance, communication…",
};

function buildCountryAdminDraft(
  countryCode: string,
  rolePermissions: Record<string, string[]>,
  countryRolePermissions: CountryRolePermissions,
) {
  const permissions = resolveCountryAdminPermissions(
    countryCode,
    rolePermissions,
    countryRolePermissions,
  );
  const draft = expandStoredPermissionsToGranular(COUNTRY_ADMIN_ROLE, permissions, { countryCode });
  if (permissions.includes("COUNTRY_PRIVILEGES")) {
    draft.add("COUNTRY_PRIVILEGES");
  }
  return draft;
}



export function PermissionsPage() {

  const { session } = useAuth();

  const { state, update } = useData();

  const ctx = usePermissionContext();

  const { showToast } = useToast();



  const canManage = canManageRolePermissions(ctx);

  const user = session?.user ?? null;
  const managedRoles = useMemo(() => getSuperadminManagedRoles(), []);



  const countries = scopedCountries(user, state);

  const allSchools = scopedSchools(user, state);



  const [countryCode, setCountryCode] = useState("");

  const [schoolCode, setSchoolCode] = useState("");

  const [selectedRole, setSelectedRole] = useState<SuperadminDraftRole | "">("");

  const [draftByRole, setDraftByRole] = useState(() => cloneRolePermissionDrafts(state.rolePermissions));

  const [busy, setBusy] = useState(false);



  const countryOptions = useMemo(

    () => [{ value: "", label: "Contexte optionnel…" }, ...countries.map(formatCountryOption)],

    [countries],

  );



  const schoolsInCountry = useMemo(

    () => schoolsForCountry(allSchools, countryCode),

    [allSchools, countryCode],

  );



  const schoolOptions = useMemo(

    () => [

      { value: "", label: countryCode ? "Contexte optionnel…" : "Sélectionnez d'abord un pays" },

      ...schoolsInCountry.map(formatSchoolOption),

    ],

    [countryCode, schoolsInCountry],

  );



  const roleOptions = useMemo(

    () => [{ value: "", label: "Choisir le rôle à configurer…" }, ...managedRoles.map((role) => ({ value: role, label: role }))],

    [managedRoles],

  );



  const modulesForRole = useMemo(
    () => (selectedRole ? getSuperadminPathModulesForRole(selectedRole, countryCode || undefined) : []),
    [selectedRole, countryCode],
  );



  const selectedCountry = countries.find((country) => country.code === countryCode);

  const selectedSchool = schoolsInCountry.find((school) => school.code === schoolCode);

  const activeDraft = selectedRole ? draftByRole[selectedRole] : new Set<string>();

  const hasAllPrivileges = selectedRole ? activeDraft.has("ALL_PRIVILEGES") : false;

  const hasCountryPrivileges =

    selectedRole === COUNTRY_ADMIN_ROLE && activeDraft.has("COUNTRY_PRIVILEGES");



  useEffect(() => {
    setDraftByRole(cloneRolePermissionDrafts(state.rolePermissions));
  }, [state.rolePermissions]);

  useEffect(() => {
    if (selectedRole !== COUNTRY_ADMIN_ROLE || !countryCode) return;
    setDraftByRole((current) => ({
      ...current,
      [COUNTRY_ADMIN_ROLE]: buildCountryAdminDraft(
        countryCode,
        state.rolePermissions,
        state.countryRolePermissions ?? {},
      ),
    }));
  }, [selectedRole, countryCode, state.rolePermissions, state.countryRolePermissions]);



  useEffect(() => {

    setSchoolCode("");

  }, [countryCode]);



  useEffect(() => {

    if (selectedRole === COUNTRY_ADMIN_ROLE) {

      setSchoolCode("");

    }

  }, [selectedRole]);



  function updateDraft(role: SuperadminDraftRole, nextSet: Set<string>) {

    setDraftByRole((current) => ({ ...current, [role]: nextSet }));

  }



  function toggle(module: string, action: string) {

    if (!canManage || !selectedRole) return;

    const key = `${module}:${action}`;

    setDraftByRole((current) => {

      const nextRoleSet = new Set(current[selectedRole]);

      if (nextRoleSet.has(key)) nextRoleSet.delete(key);

      else nextRoleSet.add(key);

      return { ...current, [selectedRole]: nextRoleSet };

    });

  }



  function toggleModule(module: string) {

    if (!canManage || !selectedRole || hasAllPrivileges) return;

    const enabled = isModuleEnabledInDraft(activeDraft, module);

    updateDraft(selectedRole, setModuleEnabledInDraft(activeDraft, module, !enabled));

  }



  function enableAllModules() {

    if (!canManage || !selectedRole || hasAllPrivileges) return;

    let next = new Set(activeDraft);

    for (const module of modulesForRole) {

      next = setModuleEnabledInDraft(next, module, true);

    }

    updateDraft(selectedRole, next);

  }



  function disableAllModules() {

    if (!canManage || !selectedRole || hasAllPrivileges) return;

    let next = new Set(activeDraft);

    for (const module of modulesForRole) {

      next = setModuleEnabledInDraft(next, module, false);

    }

    updateDraft(selectedRole, next);

  }



  function toggleCountryPrivileges() {

    if (!canManage || selectedRole !== COUNTRY_ADMIN_ROLE || hasAllPrivileges) return;

    setDraftByRole((current) => {

      const nextRoleSet = new Set(current[COUNTRY_ADMIN_ROLE]);

      if (nextRoleSet.has("COUNTRY_PRIVILEGES")) nextRoleSet.delete("COUNTRY_PRIVILEGES");

      else nextRoleSet.add("COUNTRY_PRIVILEGES");

      return { ...current, [COUNTRY_ADMIN_ROLE]: nextRoleSet };

    });

  }



  async function save() {
    setBusy(true);
    try {
      const nextRolePermissions = mergeSuperadminRolePermissions(state.rolePermissions, {
        ...state.rolePermissions,
        [SCHOOL_ADMIN_ROLE]: normalizeManagedRolePermissions(
          SCHOOL_ADMIN_ROLE,
          draftByRole[SCHOOL_ADMIN_ROLE],
        ),
      });

      let nextCountryRolePermissions: CountryRolePermissions = {
        ...(state.countryRolePermissions ?? {}),
      };

      if (countryCode) {
        nextCountryRolePermissions = {
          ...nextCountryRolePermissions,
          [countryCode]: {
            ...(nextCountryRolePermissions[countryCode] ?? {}),
            [COUNTRY_ADMIN_ROLE]: normalizeManagedRolePermissions(
              COUNTRY_ADMIN_ROLE,
              draftByRole[COUNTRY_ADMIN_ROLE],
            ),
          },
        };
      } else if (selectedRole === COUNTRY_ADMIN_ROLE) {
        nextRolePermissions[COUNTRY_ADMIN_ROLE] = normalizeManagedRolePermissions(
          COUNTRY_ADMIN_ROLE,
          draftByRole[COUNTRY_ADMIN_ROLE],
        );
      }

      let users = syncPlatformUsersWithRolePermissions(state.users, nextRolePermissions);
      if (countryCode) {
        users = syncCountryAdminUsersWithPermissions(
          users,
          countryCode,
          nextCountryRolePermissions[countryCode]?.[COUNTRY_ADMIN_ROLE] ?? [],
        );
      }

      await update({
        rolePermissions: nextRolePermissions,
        countryRolePermissions: nextCountryRolePermissions,
        users,
      });

      showToast("Permissions enregistrées", "success");
    } catch {
      showToast("Échec de l'enregistrement", "error");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDraftByRole(cloneRolePermissionDrafts(state.rolePermissions));
    if (selectedRole === COUNTRY_ADMIN_ROLE && countryCode) {
      setDraftByRole((current) => ({
        ...current,
        [COUNTRY_ADMIN_ROLE]: buildCountryAdminDraft(
          countryCode,
          state.rolePermissions,
          state.countryRolePermissions ?? {},
        ),
      }));
    }
  }



  return (

    <Card className="p-6">

      {!canManage ? (
        <>
          <SectionHeader
            title="Droits par rôle"
            description="Configuration système réservée au Super Administrateur."
          />
          <p className="mt-4 text-sm font-semibold text-muted">
            Accès refusé. Seul le Super Administrateur peut consulter et modifier la matrice des droits
            plateforme.
          </p>
        </>
      ) : (
        <>
      <SectionHeader

        title="Droits par rôle"

        description="Configuration système réservée au Super Administrateur."

        actions={

          canManage ? (

            <>

              <Button variant="secondary" size="sm" onClick={reset} disabled={busy}>

                Réinitialiser

              </Button>

              <Button size="sm" onClick={() => void save()} disabled={busy}>

                Enregistrer

              </Button>

            </>

          ) : undefined

        }

      />



      <div className="mt-4 space-y-2 rounded-xl border border-brand/20 bg-brand-50 p-4 text-sm text-ink">

        <p className="font-semibold text-brand">{SUPER_ADMIN_ROLE}</p>

        <p className="text-muted">

          Le Super Administrateur dispose de <strong className="text-ink">ALL_PRIVILEGES</strong> sur toute

          la plateforme. Cette page sert à ajouter ou retirer des fonctionnalités pour{" "}

          <strong className="text-ink">{COUNTRY_ADMIN_ROLE}</strong> et{" "}

          <strong className="text-ink">{SCHOOL_ADMIN_ROLE}</strong>.

        </p>

        <p className="text-muted">{ROLE_GOVERNANCE_NOTES.superadminMatrix}</p>
        <p className="text-muted">{ROLE_GOVERNANCE_NOTES.countryPolicy}</p>
        <p className="text-muted">{ROLE_GOVERNANCE_NOTES.localOperational}</p>

      </div>



      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <Field label="Rôle cible" hint="Rôle plateforme à configurer">

          <Select

            value={selectedRole}

            onChange={(event) => setSelectedRole(event.target.value as SuperadminDraftRole | "")}

            options={roleOptions}

          />

        </Field>



        <Field
          label="Pays"
          hint={
            selectedRole === COUNTRY_ADMIN_ROLE
              ? "Obligatoire pour la politique Admin Pays par pays"
              : "Contexte d'affichage (optionnel)"
          }
        >
          <Select
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            options={
              selectedRole === COUNTRY_ADMIN_ROLE
                ? [{ value: "", label: "Choisir un pays…" }, ...countries.map(formatCountryOption)]
                : countryOptions
            }
            disabled={!selectedRole}
          />
        </Field>



        {selectedRole === SCHOOL_ADMIN_ROLE ? (

          <Field label="Établissement (contexte)" hint="Affichage du périmètre, non requis pour éditer">

            <Select

              value={schoolCode}

              onChange={(event) => setSchoolCode(event.target.value)}

              options={schoolOptions}

              disabled={!countryCode}

            />

          </Field>

        ) : null}

      </div>



      {selectedRole && selectedCountry ? (

        <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">

          Contexte :{" "}

          <span className="font-semibold text-ink">

            {selectedCountry.code} — {selectedCountry.name}

          </span>

          {selectedRole === SCHOOL_ADMIN_ROLE && selectedSchool ? (

            <>

              {" → "}

              <span className="font-semibold text-ink">

                {selectedSchool.code} — {selectedSchool.name}

              </span>

            </>

          ) : null}

          {" · Rôle "}

          <span className="font-semibold text-brand">{selectedRole}</span>

        </p>

      ) : null}



      {selectedRole === COUNTRY_ADMIN_ROLE && !countryCode ? (
        <p className="mt-6 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Sélectionnez un pays pour configurer les droits {COUNTRY_ADMIN_ROLE} selon la politique interne
          (modules pédagogiques, finance, communication…).
        </p>
      ) : null}

      {!selectedRole ? (

        <p className="mt-6 rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">

          Choisissez un rôle plateforme ({COUNTRY_ADMIN_ROLE} ou {SCHOOL_ADMIN_ROLE}) pour afficher la matrice

          CRUD.

        </p>

      ) : null}



      {selectedRole && (selectedRole !== COUNTRY_ADMIN_ROLE || countryCode) ? (

        <>

          <div className="mt-4 flex flex-wrap items-center gap-3">

            <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand">

              Matrice CRUD — {ROLE_HINTS[selectedRole]}

            </p>

            {canManage && !hasAllPrivileges ? (

              <>

                <Button variant="secondary" size="sm" onClick={enableAllModules} disabled={busy}>

                  Tout activer

                </Button>

                <Button variant="secondary" size="sm" onClick={disableAllModules} disabled={busy}>

                  Tout retirer

                </Button>

              </>

            ) : null}

          </div>



          {hasAllPrivileges ? (

            <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand">

              Ce rôle dispose de tous les privilèges (ALL_PRIVILEGES).

            </p>

          ) : null}



          {selectedRole === COUNTRY_ADMIN_ROLE && canManage && !hasAllPrivileges ? (

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm">

              <input

                type="checkbox"

                className="h-4 w-4 accent-brand"

                checked={hasCountryPrivileges}

                onChange={toggleCountryPrivileges}

              />

              <span>

                <span className="font-medium text-ink">COUNTRY_PRIVILEGES</span>

                <span className="ml-2 text-muted">

                  — lecture transversale sur pays, établissements, abonnements et utilisateurs

                </span>

              </span>

            </label>

          ) : null}



          <div className="mt-4 overflow-x-auto">

            <table className="w-full border-collapse text-sm">

              <thead>

                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">

                  <th className="px-3 py-3 text-left font-semibold">Module</th>

                  <th className="px-3 py-3 text-center font-semibold">Actif</th>

                  {CRUD_ACTIONS.map((action) => (

                    <th key={action.key} className="px-3 py-3 text-center font-semibold">

                      {action.label}

                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {modulesForRole.map((module) => {

                  const moduleEnabled = isModuleEnabledInDraft(activeDraft, module);

                  const moduleFull = isModuleFullyEnabledInDraft(activeDraft, module);

                  return (

                    <tr key={module} className="border-b border-line/70 last:border-0">

                      <td className="px-3 py-2.5 font-medium text-ink">{module}</td>

                      <td className="px-3 py-2.5 text-center">

                        <input

                          type="checkbox"

                          className="h-4 w-4 cursor-pointer accent-brand disabled:cursor-not-allowed"

                          checked={hasAllPrivileges || moduleEnabled}

                          ref={(input) => {

                            if (input) input.indeterminate = !hasAllPrivileges && moduleEnabled && !moduleFull;

                          }}

                          disabled={!canManage || hasAllPrivileges}

                          onChange={() => toggleModule(module)}

                          title={moduleFull ? "Retirer le module" : "Activer le module (CRUD complet)"}

                        />

                      </td>

                      {CRUD_ACTIONS.map((action) => {

                        const key = `${module}:${action.key}`;

                        const checked = hasAllPrivileges || activeDraft.has(key);

                        return (

                          <td key={action.key} className="px-3 py-2.5 text-center">

                            <input

                              type="checkbox"

                              className="h-4 w-4 cursor-pointer accent-brand disabled:cursor-not-allowed"

                              checked={checked}

                              disabled={!canManage || hasAllPrivileges}

                              onChange={() => toggle(module, action.key)}

                            />

                          </td>

                        );

                      })}

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>



          <p className="mt-4 text-xs text-muted">

            Cochez la colonne « Actif » pour accorder ou retirer un module entier. Les cases CRUD permettent un
            réglage fin.
            {selectedRole === COUNTRY_ADMIN_ROLE && countryCode
              ? ` Les changements s'appliquent aux comptes ${COUNTRY_ADMIN_ROLE} du pays ${countryCode} après enregistrement.`
              : ` Les changements s'appliquent à tous les comptes ${selectedRole} après enregistrement.`}

          </p>

        </>

      ) : null}

        </>
      )}

    </Card>

  );

}

