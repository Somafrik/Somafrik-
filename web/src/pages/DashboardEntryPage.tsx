import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isInternalSchoolRole } from "../lib/format";
import { OverviewPage } from "./OverviewPage";

/** Les comptes établissement arrivent sur le hub de pilotage, pas l'overview plateforme. */
export function DashboardEntryPage() {
  const { session } = useAuth();
  if (isInternalSchoolRole(session?.user?.role)) {
    return <Navigate to="/etablissement" replace />;
  }
  return <OverviewPage />;
}
