import { NavLink } from "react-router-dom";
import { SOMAFRIK_LOGO_URL } from "../../lib/brand";
import { NAV_ITEMS } from "../../lib/constants";
import { SCHOOL_ENTITY_SIDEBAR_VIEWS } from "../../lib/entityModules";
import { isInternalSchoolRole } from "../../lib/format";
import { COUNTRY_ADMIN_ROLE, isSuperAdminRole } from "../../lib/orgHierarchy";
import { canReadView } from "../../lib/permissions";
import { canAccessSchoolOperationalViews } from "../../lib/superadminSchoolContext";
import { usePermissionContext } from "../../lib/usePermissionContext";
import { useAuth } from "../../context/AuthContext";

const SCHOOL_VIEWS = new Set(["establishment", "configuration", ...SCHOOL_ENTITY_SIDEBAR_VIEWS]);
const STRUCTURE_VIEWS = new Set(["countries", "schools", "subscriptions"]);

export function Sidebar() {
  const ctx = usePermissionContext();
  const { session } = useAuth();
  const role = session?.user?.role;
  const internalSchool = isInternalSchoolRole(role);
  const superadminSchoolMode = canAccessSchoolOperationalViews(session);

  const visible = NAV_ITEMS.filter((item) => {
    if (item.schoolOnly && !internalSchool && !superadminSchoolMode) return false;
    return canReadView(ctx, item.view);
  });

  const schoolItems = visible.filter((item) => SCHOOL_VIEWS.has(item.view));
  const platformItems = visible.filter(
    (item) =>
      !SCHOOL_VIEWS.has(item.view) &&
      !(internalSchool && (item.view === "users" || item.view === "permissions")),
  );
  const structureItems = platformItems.filter((item) => STRUCTURE_VIEWS.has(item.view));
  const adminItems = platformItems.filter((item) => !STRUCTURE_VIEWS.has(item.view));

  const structureTitle = role === COUNTRY_ADMIN_ROLE ? "Périmètre pays" : "Pays → Local";

  function NavLinks({ items }: { items: typeof visible }) {
    return items.map((item) => (
      <NavLink
        key={item.view}
        to={item.path}
        end={item.path === "/tableau-de-bord"}
        className={({ isActive }) =>
          `block rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive ? "bg-brand-50 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
          }`
        }
      >
        {item.label}
      </NavLink>
    ));
  }

  const activeSchoolCode = session?.activeSchoolCode ?? session?.user?.schoolCode;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-white lg:flex">
      <div className="border-b border-line px-3 py-5">
        <img
          src={SOMAFRIK_LOGO_URL}
          alt="Logo Somafrik"
          className="mx-auto h-28 w-full max-w-[260px] object-contain"
        />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          <NavLinks items={visible.filter((item) => item.view === "overview")} />
        </div>

        {(internalSchool || superadminSchoolMode) && schoolItems.length ? (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-brand">
              {isSuperAdminRole(role) ? "Établissement sélectionné" : "Mon établissement"}
            </p>
            <div className="space-y-1">
              <NavLinks items={schoolItems} />
            </div>
          </div>
        ) : null}

        {!internalSchool && !superadminSchoolMode && structureItems.length ? (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-brand">
              {structureTitle}
            </p>
            <div className="space-y-1">
              <NavLinks items={structureItems} />
            </div>
          </div>
        ) : null}

        {!internalSchool && !superadminSchoolMode && adminItems.length ? (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-muted">
              Administration
            </p>
            <div className="space-y-1">
              <NavLinks items={adminItems} />
            </div>
          </div>
        ) : null}

        {internalSchool && adminItems.length ? (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-muted">
              Administration
            </p>
            <div className="space-y-1">
              <NavLinks items={adminItems} />
            </div>
          </div>
        ) : null}

        {superadminSchoolMode && adminItems.length ? (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wide text-muted">
              Administration plateforme
            </p>
            <div className="space-y-1">
              <NavLinks items={adminItems} />
            </div>
          </div>
        ) : null}
      </nav>

      {activeSchoolCode ? (
        <p className="border-t border-line px-6 py-4 text-xs text-muted">
          Établissement · {activeSchoolCode}
        </p>
      ) : (
        <p className="px-6 py-4 text-xs text-muted">SaaS multi-pays · multi-établissements</p>
      )}
    </aside>
  );
}
