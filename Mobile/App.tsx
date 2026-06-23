import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { AdminDataProvider } from "./src/context/AdminDataContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdminDataProvider>
          <AppNavigator />
        </AdminDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
