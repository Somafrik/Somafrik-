import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "RoleSelection"
>;

export default function RoleSelectionScreen({
  navigation,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connectez-vous à votre établissement</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Login", {
            role: "school_admin",
          })
        }
      >
        <Text style={styles.cardText}>
          🏫 Administration école
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Login", {
            role: "teacher",
          })
        }
      >
        <Text style={styles.cardText}>
          👨‍🏫 Enseignant
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Login", {
            role: "parent_student",
          })
        }
      >
        <Text style={styles.cardText}>
          👨‍👩‍👧 Parent / Étudiant
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});