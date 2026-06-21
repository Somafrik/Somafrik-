import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getLiveKpis, scopedCountries, scopedSchools } from "../lib/scope";
import { formatMetric, isInternalSchoolRole } from "../lib/format";
import { PLATFORM_LEVELS } from "../lib/orgHierarchy";
import { NAV_ITEMS } from "../lib/constants";
import { canReadView, hasBackOfficePermission, hasSchoolPilotageAccess } from "../lib/permissions";
import { usePermissionContext } from "../lib/usePermissionContext";
import { Card } from "../components/ui/Card";
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
  const { state } = useData();
  const ctx = usePermissionContext();
  const user = session?.user ?? null;
  const kpis = filterKpisByPermissions(getLiveKpis(user, state), ctx);
  const quickLinks = NAV_ITEMS.filter((item) => item.view !== "overview" && canReadView(ctx, item.view));
  const showEstablishmentHub = isInternalSchoolRole(user?.role) && hasSchoolPilotageAccess(ctx);
  const countries = scopedCountries(user, state);
  const schools = scopedSchools(user, state);

  const structureLevels = PLATFORM_LEVELS.map((level) => ({
    ...level,
    value: level.key === "pays" ? countries.length : schools.length,
  }));

  return (
    <div className="space-y-6">
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
