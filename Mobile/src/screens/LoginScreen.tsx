import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { IdentifyResponse, identifyAccount, login } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const { school } = route.params;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identity, setIdentity] = useState<IdentifyResponse | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setSession } = useAuth();

  useEffect(() => {
    const normalizedIdentifier = identifier.trim();
    setIdentity(null);

    if (normalizedIdentifier.length < 3) {
      return;
    }

    const timeout = setTimeout(async () => {
      setIsIdentifying(true);

      try {
        const result = await identifyAccount({
          schoolCode: school.code,
          identifier: normalizedIdentifier,
        });
        setIdentity(result);
      } catch {
        setIdentity(null);
      } finally {
        setIsIdentifying(false);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [identifier, school.code]);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez saisir votre identifiant et votre mot de passe.");
      return;
    }

    if (!identity) {
      Alert.alert("Compte introuvable", "Veuillez saisir un identifiant reconnu par l'établissement.");
      return;
    }

    setIsLoading(true);

    try {
      const session = await login({
        role: identity.role,
        schoolCode: school.code,
        identifier: identifier.trim(),
        pin: password.trim(),
      });

      setSession(session);
      navigation.navigate("Home", {
        role: identity.role,
      });
    } catch (error) {
      Alert.alert(
        "Connexion impossible",
        error instanceof Error ? error.message : "Veuillez réessayer"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setIdentifier("ENS-0001");
    setPassword("1234");
  };

  return (
    <View style={styles.container}>
      <View style={styles.schoolLogo}>
        {school.logoUrl ? (
          <Image source={{ uri: school.logoUrl }} style={styles.schoolLogoImage} />
        ) : (
          <Ionicons name="school-outline" size={38} color="#2563EB" />
        )}
      </View>
      <Text style={styles.title}>{school.name}</Text>
      <Text style={styles.subtitle}>{school.city} • {school.code}</Text>

      <TextInput
        placeholder="Identifiant local : ELE-0001, ENS-0001 ou téléphone parent"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.roleRow}>
        <Text style={styles.roleLabel}>Rôle détecté</Text>
        {isIdentifying ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <Text style={[styles.roleBadge, !identity && styles.roleBadgeMuted]}>
            {identity?.roleLabel ?? "En attente"}
          </Text>
        )}
      </View>

      {identity && (
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      )}

      <TouchableOpacity
        style={[styles.loginButton, (!identity || isLoading) && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={!identity || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.demoButton} onPress={fillDemo}>
        <Text style={styles.demoButtonText}>Remplir un compte enseignant demo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  schoolLogo: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  schoolLogoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
    color: "#0F172A",
    fontWeight: "800",
  },
  roleRow: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleLabel: {
    color: "#64748B",
    fontWeight: "900",
  },
  roleBadge: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: "900",
  },
  roleBadgeMuted: {
    color: "#94A3B8",
    backgroundColor: "#F1F5F9",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  demoButton: {
    marginTop: 16,
    padding: 12,
  },
  demoButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "900",
  },
});
