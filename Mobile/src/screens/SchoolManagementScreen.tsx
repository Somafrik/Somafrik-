import { Text, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import MenuCard from "../components/MenuCard";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "SchoolManagement"
>;

export default function SchoolManagementScreen({
  navigation,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestion de l'école</Text>

      <MenuCard
        title="🏫 Établissements"
        onPress={() => navigation.navigate("AdminCrud", { entity: "schools" })}
      />

      <MenuCard
        title="👤 Utilisateurs"
        onPress={() => navigation.navigate("AdminCrud", { entity: "users" })}
      />

      <MenuCard
        title="👥 Élèves"
        onPress={() => navigation.navigate("AdminCrud", { entity: "students" })}
      />

      <MenuCard
        title="👨‍🏫 Enseignants"
        onPress={() => navigation.navigate("AdminCrud", { entity: "teachers" })}
      />

      <MenuCard
        title="📚 Classes"
        onPress={() => navigation.navigate("AdminCrud", { entity: "classes" })}
      />

      <MenuCard
        title="📖 Cours"
        onPress={() => navigation.navigate("AdminCrud", { entity: "courses" })}
      />

      <MenuCard
        title="🔁 Affectations"
        onPress={() => navigation.navigate("AdminCrud", { entity: "assignments" })}
      />

      <MenuCard
        title="💰 Paiements"
        onPress={() => navigation.navigate("AdminCrud", { entity: "payments" })}
      />

      <MenuCard
        title="⚙️ Statuts paiement"
        onPress={() => navigation.navigate("AdminCrud", { entity: "paymentStatuses" })}
      />

      <MenuCard
        title="💬 Messages parents"
        onPress={() => navigation.navigate("AdminCrud", { entity: "messages" })}
      />

      <MenuCard
        title="📢 Annonces"
        onPress={() => navigation.navigate("AdminCrud", { entity: "announcements" })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
});
