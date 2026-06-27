import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { isSuperAdminRole } from "../../lib/orgHierarchy";
import { scopedSchools } from "../../lib/scope";
import { getActiveSchoolCode } from "../../lib/superadminSchoolContext";
import { Select } from "../ui/Field";

export function SuperadminSchoolSelector() {
  const { session, setActiveSchool } = useAuth();
  const { state } = useData();
  const navigate = useNavigate();

  const isSuperadmin = isSuperAdminRole(session?.user?.role);
  const schools = useMemo(
    () => scopedSchools(session?.user ?? null, state),
    [session?.user, state],
  );
  const activeCode = getActiveSchoolCode(session);

  const options = useMemo(
    () => [
      { value: "", label: "Choisir un établissement…" },
      ...schools.map((school) => ({
        value: school.code,
        label: `${school.code} — ${school.name}`,
      })),
    ],
    [schools],
  );

  if (!isSuperadmin) return null;

  return (
    <div className="hidden min-w-[220px] lg:block">
      <Select
        value={activeCode ?? ""}
        onChange={(event) => {
          const next = event.target.value.trim();
          setActiveSchool(next || null);
          if (next) navigate("/etablissement");
        }}
        options={options}
        aria-label="Établissement actif"
      />
      <p className="mt-1 text-[10px] text-muted">Contexte établissement pour pilotage et configuration</p>
    </div>
  );
}
