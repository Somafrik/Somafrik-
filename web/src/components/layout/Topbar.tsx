import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useActiveSchool } from "../../context/ActiveSchoolContext";
import { displayRoleName, getInitials } from "../../lib/format";
import { formatSchoolOption } from "../../lib/superadminCrudPath";
import { Button } from "../ui/Button";
import { Field, Select } from "../ui/Field";

export function Topbar({ title }: { title: string }) {
  const { session, logout } = useAuth();
  const { loading, error, refresh } = useData();
  const { requiresSelection, availableSchools, activeSchoolCode, setActiveSchoolCode } = useActiveSchool();
  const user = session?.user;
  const scope = session?.scope;

  const showSchoolPicker = requiresSelection && availableSchools.length > 0;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/90 px-6 py-3 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        {scope?.label ? <p className="text-xs text-muted">{scope.label}</p> : null}
      </div>

      <div className="flex items-center gap-3">
        {showSchoolPicker ? (
          <div className="hidden min-w-[220px] md:block">
            <Field label="Établissement actif">
              <Select
                value={activeSchoolCode}
                onChange={(e) => setActiveSchoolCode(e.target.value)}
                options={availableSchools.map(formatSchoolOption)}
              />
            </Field>
          </div>
        ) : null}
        {error ? (
          <p className="max-w-xs truncate text-xs text-danger" title={error}>
            {error}
          </p>
        ) : null}
        <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Synchronisation…" : "Rafraîchir"}
        </Button>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight text-ink">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted">{displayRoleName(user?.role)}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
