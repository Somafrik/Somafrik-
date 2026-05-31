import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation, route }: Props) {
const [schoolCode, setSchoolCode] = useState("");
const [phone, setPhone] = useState("");
const [pin, setPin] = useState("");
const { role } = route.params;

 const handleLogin = () => {
  if (!schoolCode || !phone || !pin) {
    Alert.alert("Erreur", "Veuillez remplir tous les champs");
    return;
  }

  navigation.navigate("Home", {
  role,
});
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SchoolLink</Text>

     

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
        placeholder="Numéro de téléphone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
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
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>
          Se connecter
        </Text>
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

  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});