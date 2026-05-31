import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { AdminDataProvider } from "./src/context/AdminDataContext";

export default function App() {
  return (
    <AuthProvider>
      <AdminDataProvider>
        <AppNavigator />
      </AdminDataProvider>
    </AuthProvider>
  );
}
