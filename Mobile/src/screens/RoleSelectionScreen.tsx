import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SchoolInfo, getSchoolByCode } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelection">;

export default function RoleSelectionScreen({ navigation }: Props) {
  const [accessCode, setAccessCode] = useState("CD-2026-0001");
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyAccess = async () => {
    const normalizedAccess = accessCode.trim().toUpperCase();

    if (!normalizedAccess) {
      Alert.alert("Accès SchoolLink", "Veuillez saisir un code établissement ou un identifiant admin.");
      return;
    }

    if (normalizedAccess === "SUPERADMIN" || normalizedAccess === "SUPERADMIN-SCHOOLLINK") {
      navigation.navigate("Login", {
        school: getPlatformSchool("Global"),
        accessIdentifier: "superadmin",
        accessRole: "super_admin",
        accessRoleLabel: "Super Administrateur",
      });
      return;
    }

    if (normalizedAccess.startsWith("ADMINPAYS-")) {
      const countryCode = normalizedAccess.replace("ADMINPAYS-", "");
      navigation.navigate("Login", {
        school: getPlatformSchool(countryCode),
        accessIdentifier: countryCode === "CD" ? "admin-rdc" : `admin-${countryCode.toLowerCase()}`,
        accessRole: "country_admin",
        accessRoleLabel: "Admin Pays",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await getSchoolByCode(accessCode);
      setSchool(result);
    } catch (error) {
      setSchool(null);
      Alert.alert(
        "Établissement introuvable",
        error instanceof Error ? error.message : "Code établissement invalide"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>SchoolLink</Text>
      <Text style={styles.title}>Se connecter à l'établissement</Text>

      <TextInput
        placeholder="Code établissement / Identifiant organisation"
        value={accessCode}
        onChangeText={(value) => {
          setAccessCode(value);
          setSchool(null);
        }}
        autoCapitalize="characters"
        style={styles.input}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={verifyAccess}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryText}>Continuer</Text>
        )}
      </TouchableOpacity>

      {school && (
        <View style={styles.schoolCard}>
          <View style={styles.logo}>
            <Ionicons name="school-outline" size={34} color="#2563EB" />
          </View>
          <Text style={styles.schoolName}>{school.name}</Text>
          <Text style={styles.schoolCity}>{school.city}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login", { school })}
          >
            <Text style={styles.loginText}>Accéder à la connexion</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getPlatformSchool(scope: string): SchoolInfo {
  return {
    id: `PLATFORM-${scope}`,
    publicId: scope,
    code: "CD-2026-0001",
    name: scope === "Global" ? "SchoolLink Global" : `SchoolLink ${scope}`,
    city: scope === "Global" ? "Plateforme" : scope,
    country: scope,
    slogan: "Pilotage mobile et tablette",
    status: "Actif",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  brand: {
    color: "#2563EB",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.75,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  schoolCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginTop: 22,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  schoolName: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  schoolCity: {
    color: "#64748B",
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
