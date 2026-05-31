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
        title="💰 Paiements"
        onPress={() => navigation.navigate("AdminCrud", { entity: "payments" })}
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
