import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { paiements } from "../data/paiements";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPayments">;

export default function StudentPaymentsScreen({ route }: Props) {
  const { studentId } = route.params;

  const paiementsEleve = paiements.filter(
    (paiement) => paiement.eleveId === studentId
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiements</Text>

      <FlatList
        data={paiementsEleve}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.montant} FC</Text>
            <Text>Date : {item.date}</Text>
            <Text>
              Statut : {item.statut === "PAYE" ? "Payé" : "En attente"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold" },
});