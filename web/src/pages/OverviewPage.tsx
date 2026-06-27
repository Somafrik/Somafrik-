import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getLiveKpis, scopedCountries, scopedSchools, scopedUsers } from "../lib/scope";
import { formatMetric, isInternalSchoolRole } from "../lib/format";
import { canAccessSchoolOperationalViews } from "../lib/superadminSchoolContext";
import {
  isSchoolAwaitingSuperadminValidation,
  isSuperAdminRole,
  isUserAwaitingSuperadminValidation,
  PLATFORM_LEVELS,
  VALIDATED_STATUS,
} from "../lib/orgHierarchy";
import { NAV_ITEMS } from "../lib/constants";
import { canReadView, hasBackOfficePermission, hasSchoolPilotageAccess } from "../lib/permissions";
import { usePermissionContext } from "../lib/usePermissionContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import type { Kpi } from "../lib/scope";

const KPI_FEATURES: Record<string, string | null> = {
  "Utilisateurs actifs": "Utilisateurs",
  "Élèves suivis": "Élèves",
  Enseignants: "Enseignants",
  "Alertes à traiter": "Notifications",
  Pays: "Pays",
  Établissements: "Établissements",
  "Revenus mensuels": "Abonnements",
  "Alertes plateforme": "Abonnements",
};

function filterKpisByPermissions(kpis: Kpi[], ctx: ReturnType<typeof usePermissionContext>) {
  return kpis.filter((kpi) => {
    const feature = KPI_FEATURES[kpi.label];
    if (!feature) return true;
    return hasBackOfficePermission(ctx, feature, "READ");
  });
}

export function OverviewPage() {
  const { session } = useAuth();
  const { state, update } = useData();
  const { showToast } = useToast();
  const ctx = usePermissionContext();
  const user = session?.user ?? null;
  const kpis = filterKpisByPermissions(getLiveKpis(user, state), ctx);
  const quickLinks = NAV_ITEMS.filter((item) => item.view !== "overview" && canReadView(ctx, item.view));
  const showEstablishmentHub =
    canAccessSchoolOperationalViews(session) && hasSchoolPilotageAccess(ctx);
  const countries = scopedCountries(user, state);
  const schools = scopedSchools(user, state);
  const platformUsers = scopedUsers(user, state);
  const isSuperadmin = isSuperAdminRole(user?.role);
  const pendingSchools = schools.filter(isSchoolAwaitingSuperadminValidation);
  const pendingUsers = platformUsers.filter(isUserAwaitingSuperadminValidation);
  const hasPendingValidations = isSuperadmin && (pendingSchools.length > 0 || pendingUsers.length > 0);

  const structureLevels = PLATFORM_LEVELS.map((level) => ({
    ...level,
    value: level.key === "pays" ? countries.length : schools.length,
  }));

  async function validateAllPending() {
    if (!isSuperadmin) return;
    const validatedBy = session?.user?.identifier ?? session?.user?.firstName ?? "Super Admin";
    const validatedAt = new Date().toISOString();
    const pendingSchoolCodes = new Set(
      state.schools.filter(isSchoolAwaitingSuperadminValidation).map((school) => school.code),
    );
    const pendingUserIds = new Set(
      state.users.filter(isUserAwaitingSuperadminValidation).map((account) => account.id),
    );
    if (!pendingSchoolCodes.size && !pendingUserIds.size) return;

    try {
      await update({
        schools: state.schools.map((school) =>
          pendingSchoolCodes.has(school.code)
            ? { ...school, validationStatus: VALIDATED_STATUS, validatedBy, validatedAt }
            : school,
        ),
        users: state.users.map((account) =>
          pendingUserIds.has(account.id)
            ? {
                ...account,
                status: "Actif",
                validationStatus: VALIDATED_STATUS,
                validatedBy,
                validatedAt,
              }
            : account,
        ),
      });
      showToast(
        `${pendingSchoolCodes.size} établissement(s) et ${pendingUserIds.size} compte(s) validé(s).`,
        "success",
      );
    } catch {
      showToast("Échec de la validation", "error");
    }
  }

  return (
    <div className="space-y-6">
      {hasPendingValidations ? (
        <Card className="border-amber/30 bg-amber/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-amber">Validations en attente</p>
              <p className="mt-1 text-sm text-muted">
                {pendingSchools.length > 0
                  ? `${pendingSchools.length} établissement(s) à valider`
                  : null}
                {pendingSchools.length > 0 && pendingUsers.length > 0 ? " • " : null}
                {pendingUsers.length > 0 ? `${pendingUsers.length} compte(s) Admin École à valider` : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingSchools.length > 0 ? (
                <Link
                  to="/etablissements"
                  className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40"
                >
                  Voir établissements
                </Link>
              ) : null}
              {pendingUsers.length > 0 ? (
                <Link
                  to="/utilisateurs"
                  className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40"
                >
                  Voir utilisateurs
                </Link>
              ) : null}
              <Button onClick={() => void validateAllPending()}>Tout valider</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {!isInternalSchoolRole(user?.role) ? (
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Structure Somafrik</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {structureLevels.map((level) => (
              <div key={level.key} className="rounded-xl border border-line bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{level.label}</p>
                <p className="mt-2 text-2xl font-black text-ink">{formatMetric(level.value)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {showEstablishmentHub ? (
        <Card className="border-brand/20 bg-brand-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-brand">Pilotage établissement</p>
              <p className="mt-1 text-sm text-muted">
                Consultez et administrez votre école selon les droits configurés localement.
              </p>
            </div>
            <Link
              to="/etablissement"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand transition hover:bg-brand-700"
            >
              Ouvrir mon établissement
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="bg-gradient-to-br from-brand to-brand-700 p-6 text-white">
        <p className="text-sm font-semibold text-white/70">
          {session?.scope?.label ?? "Périmètre courant"}
        </p>
        <h2 className="mt-1 text-2xl font-black">
          Bonjour {user?.firstName} {user?.lastName}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          {session?.scope?.hint ??
            "Les indicateurs et actions ci-dessous sont filtrés selon les droits de votre rôle."}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{kpi.label}</p>
            <p className="mt-2 text-2xl font-black text-ink">
              {formatMetric(kpi.value, kpi.suffix)}
            </p>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Accès rapides</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.view} to={link.path}>
              <Card className="h-full p-5 transition hover:border-brand/40 hover:shadow-md">
                <p className="text-base font-bold text-ink">{link.label}</p>
                <p className="mt-1 text-sm text-muted">Ouvrir le module {link.label.toLowerCase()}.</p>
                <span className="mt-3 inline-block text-sm font-semibold text-brand">Ouvrir →</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
