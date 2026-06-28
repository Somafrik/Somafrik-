import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Card, SectionHeader } from "../components/ui/Card";
import { formatMetric } from "../lib/format";
import { getEstablishmentMetrics } from "../lib/establishment";
import {
  ENTITY_MODULE_GROUP_LABELS,
  ENTITY_MODULE_GROUP_ORDER,
  getModulesByGroup,
  SCHOOL_ENTITY_MODULES,
  SCHOOL_ENTITY_SIDEBAR_VIEWS,
} from "../lib/entityModules";
import { scopedUsers } from "../lib/scope";
import { canReadView, hasBackOfficePermission, canAccessSchoolBackOffice } from "../lib/permissions";
import { usePermissionContext } from "../lib/usePermissionContext";
import { useActiveSchool } from "../context/ActiveSchoolContext";
import { formatSchoolOption } from "../lib/superadminCrudPath";
import { NAV_ITEMS } from "../lib/constants";
import { Field, Select } from "../components/ui/Field";

export function EstablishmentPage() {
  const { session } = useAuth();
  const { state } = useData();
  const ctx = usePermissionContext();
  const user = session?.user ?? null;
  const {
    activeSchoolCode: schoolCode,
    activeSchool: school,
    availableSchools,
    requiresSelection,
    scopedUser,
    setActiveSchoolCode,
  } = useActiveSchool();

  const users = scopedUsers(scopedUser, state);
  const metrics = getEstablishmentMetrics(scopedUser, state, users);

  const modules = useMemo(
    () =>
      SCHOOL_ENTITY_MODULES.filter(
        (module) =>
          module.group !== "utilisateurs" && hasBackOfficePermission(ctx, module.feature, "READ"),
      ),
    [ctx],
  );

  const modulesByGroup = useMemo(() => getModulesByGroup(modules), [modules]);

  const adminModules = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) =>
          item.view !== "overview" &&
          item.view !== "establishment" &&
          !item.schoolOnly &&
          !SCHOOL_ENTITY_SIDEBAR_VIEWS.has(item.view) &&
          canReadView(ctx, item.view),
      ),
    [ctx],
  );

  if (!canAccessSchoolBackOffice(user?.role)) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold text-muted">
          Le pilotage établissement est réservé aux comptes internes d'une école.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-teal to-brand p-6 text-white">
        <p className="text-sm font-semibold text-white/75">Pilotage établissement</p>
        {requiresSelection && availableSchools.length > 1 ? (
          <div className="mt-3 max-w-md">
            <Field label="Établissement">
              <Select
                value={schoolCode}
                onChange={(e) => setActiveSchoolCode(e.target.value)}
                options={availableSchools.map(formatSchoolOption)}
              />
            </Field>
          </div>
        ) : null}
        <h2 className="mt-3 text-2xl font-black">{school?.name ?? "Mon établissement"}</h2>
        <p className="mt-2 text-sm text-white/85">
          {school
            ? `${school.code} • ${school.city ?? "Ville non renseignée"} • ${school.type ?? "Établissement"}`
            : "Code établissement : " + (schoolCode ?? "—")}
        </p>
        <p className="mt-3 max-w-3xl text-sm text-white/80">
          Les modules ci-dessous sont visibles selon les autorisations de votre établissement.
          Les rôles métier et leurs droits se configurent dans Configuration.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
        {[
          ["Utilisateurs", metrics.activeUsers],
          ["Examens", metrics.exams],
          ["Bulletins", metrics.bulletins],
          ["À valider", metrics.pendingBulletins],
          ["Documents", metrics.documents],
          ["Paiements", metrics.payments],
          ["Présences", metrics.presences],
          ["Notes", metrics.notes],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{formatMetric(Number(value))}</p>
          </Card>
        ))}
      </div>

      {modules.length ? (
        <section className="space-y-6">
          {ENTITY_MODULE_GROUP_ORDER.map((group) => {
            const groupModules = modulesByGroup[group];
            if (!groupModules.length) return null;
            return (
              <div key={group}>
                <SectionHeader
                  title={ENTITY_MODULE_GROUP_LABELS[group]}
                  description="Modules autorisés pour votre établissement."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupModules.map((module) => (
                    <Link key={module.key} to={module.path}>
                      <Card className="h-full p-5 transition hover:border-brand/40 hover:shadow-md">
                        <p className="text-base font-bold text-ink">{module.label}</p>
                        <p className="mt-1 text-sm text-muted">{module.description}</p>
                        <span className="mt-3 inline-block text-sm font-semibold text-brand">Ouvrir →</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {adminModules.length ? (
        <section>
          <SectionHeader
            title="Administration interne"
            description="Utilisateurs, notifications, configuration et rapports selon vos droits."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminModules.map((item) => (
              <Link key={item.view} to={item.path}>
                <Card className="h-full p-5 transition hover:border-brand/40 hover:shadow-md">
                  <p className="text-base font-bold text-ink">{item.label}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand">Ouvrir →</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
