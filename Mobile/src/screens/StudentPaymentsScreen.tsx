import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById, payments } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPayments">;

export default function StudentPaymentsScreen({ route, navigation }: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const studentId = selectedStudentId ?? route?.params?.studentId;
  const student = studentId ? getStudentById(studentId) : undefined;

  const paiementsEleve = payments.filter(
    (paiement) => paiement.studentId === studentId
  );
  const totalPaid = paiementsEleve
    .filter((paiement) => paiement.status === "PAYE")
    .reduce((sum, paiement) => sum + paiement.amount, 0);

  return (
    <View style={styles.container}>
      <StudentSwitcher />
      <Text style={styles.title}>Paiements</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.summaryCard}
        onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
      >
        <Text style={styles.summaryLabel}>Total payé</Text>
        <Text style={styles.summaryValue}>{totalPaid.toLocaleString()} FC</Text>
      </TouchableOpacity>

      <FlatList
        data={paiementsEleve}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement enregistré.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
          >
            <View>
              <Text style={styles.name}>{item.amount.toLocaleString()} FC</Text>
              <Text style={styles.meta}>Date : {item.date}</Text>
            </View>
            <Text style={[styles.badge, item.status === "PAYE" ? styles.success : styles.warning]}>
              {item.status === "PAYE" ? "Payé" : "En attente"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
  title: { fontSize: 30, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#64748B", fontWeight: "700" },
  summaryCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  summaryLabel: { color: "#DBEAFE", fontWeight: "700" },
  summaryValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  meta: { marginTop: 4, color: "#64748B", fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: "900" },
  success: { backgroundColor: "#DCFCE7", color: "#166534" },
  warning: { backgroundColor: "#FEF3C7", color: "#92400E" },
  empty: { color: "#64748B", fontWeight: "700" },
});
