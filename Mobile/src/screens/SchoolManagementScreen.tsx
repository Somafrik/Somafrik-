import { Text, StyleSheet, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import MenuCard from "../components/MenuCard";
import { AdminEntity } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { canReadEntity } from "../domain/security/permissions";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "SchoolManagement"
>;

export default function SchoolManagementScreen({
  navigation,
}: Props) {
  const { session } = useAuth();
  const items = [
    { title: "🏫 Établissements", entity: "schools" },
    { title: "👤 Utilisateurs", entity: "users" },
    { title: "👥 Élèves", entity: "students" },
    { title: "👨‍🏫 Enseignants", entity: "teachers" },
    { title: "📚 Classes", entity: "classes" },
    { title: "📖 Cours", entity: "courses" },
    { title: "🔁 Affectations", entity: "assignments" },
    { title: "💰 Paiements", entity: "payments" },
    { title: "⚙️ Statuts paiement", entity: "paymentStatuses" },
    { title: "💬 Messages parents", entity: "messages" },
    { title: "📢 Annonces", entity: "announcements" },
  ] satisfies { title: string; entity: AdminEntity }[];
  const visibleItems = items.filter((item) => canReadEntity(session, item.entity));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestion de l'école</Text>

      {visibleItems.map((item) => (
        <MenuCard
          key={item.entity}
          title={item.title}
          onPress={() => navigation.navigate("AdminCrud", { entity: item.entity })}
        />
      ))}

      {visibleItems.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun module autorisé pour ce rôle.</Text>
        </View>
      )}
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  emptyText: {
    color: "#64748B",
    fontWeight: "700",
  },
});
