import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { DataProvider } from "./context/DataContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardEntryPage } from "./pages/DashboardEntryPage";
import { CountriesPage } from "./pages/CountriesPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { UsersPage } from "./pages/UsersPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { EstablishmentPage } from "./pages/EstablishmentPage";
import { ConfigurationPage } from "./pages/ConfigurationPage";
import { EntityPage } from "./pages/EntityPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DataProvider>
              <AppLayout />
            </DataProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/tableau-de-bord" element={<DashboardEntryPage />} />
        <Route path="/etablissement" element={<EstablishmentPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route path="/configuration/eleves" element={<EntityPage entity="students" />} />
        <Route path="/configuration/enseignants" element={<EntityPage entity="teachers" />} />
        <Route path="/configuration/utilisateurs" element={<UsersPage />} />
        <Route path="/eleves" element={<Navigate to="/configuration/eleves" replace />} />
        <Route path="/enseignants" element={<Navigate to="/configuration/enseignants" replace />} />
        <Route path="/classes" element={<EntityPage entity="classes" />} />
        <Route path="/matieres" element={<EntityPage entity="courses" />} />
        <Route path="/affectations" element={<EntityPage entity="assignments" />} />
        <Route path="/paiements" element={<EntityPage entity="payments" />} />
        <Route path="/messages" element={<EntityPage entity="messages" />} />
        <Route path="/presences" element={<EntityPage entity="presences" />} />
        <Route path="/notes" element={<EntityPage entity="notes" />} />
        <Route path="/examens" element={<EntityPage entity="exams" />} />
        <Route path="/bulletins" element={<EntityPage entity="bulletins" />} />
        <Route path="/documents" element={<EntityPage entity="documents" />} />
        <Route path="/annonces" element={<EntityPage entity="announcements" />} />
        <Route path="/pays" element={<CountriesPage />} />
        <Route path="/etablissements" element={<SchoolsPage />} />
        <Route path="/abonnements" element={<SubscriptionsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/utilisateurs" element={<UsersPage />} />
        <Route path="/permissions" element={<PermissionsPage />} />
        <Route path="/rapports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
    </Routes>
  );
}
