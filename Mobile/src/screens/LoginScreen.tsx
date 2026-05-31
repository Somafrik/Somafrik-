import React, { useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
  const [schoolCode, setSchoolCode] = useState("SCH001");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { role } = route.params;
  const { setSession } = useAuth();

  const roleLabel =
    role === "school_admin"
      ? "Administration"
      : role === "teacher"
        ? "Enseignant"
        : "Parent / Étudiant";

  const identifierPlaceholder =
    role === "school_admin"
      ? "Identifiant administrateur"
      : "Téléphone parent ou matricule";

  const handleLogin = async () => {
    if (!schoolCode.trim() || !identifier.trim() || !pin.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const session = await login({
        role,
        schoolCode: schoolCode.trim().toUpperCase(),
        identifier: identifier.trim(),
        pin: pin.trim(),
      });

      setSession(session);
      navigation.navigate("Home", {
        role,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SchoolLink</Text>

      <Text style={styles.roleBadge}>{roleLabel}</Text>
      <Text style={styles.subtitle}>
        Connectez-vous à votre établissement
      </Text>
      <TextInput
         placeholder="Code établissement"
         value={schoolCode}
         onChangeText={setSchoolCode}
         autoCapitalize="characters"
         style={styles.input}
      />

      <TextInput
        placeholder={identifierPlaceholder}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Code PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>
            Se connecter
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.demoButton}
        onPress={() => {
          setSchoolCode("SCH001");
          setIdentifier(role === "school_admin" ? "admin" : "MAT001");
          setPin("1234");
        }}
      >
        <Text style={styles.demoButtonText}>Remplir les identifiants demo</Text>
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
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 10,
  },

  schoolName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  roleBadge: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  loginButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  loginButtonDisabled: {
    opacity: 0.75,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  demoButton: {
    marginTop: 16,
    padding: 12,
  },

  demoButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },
});
