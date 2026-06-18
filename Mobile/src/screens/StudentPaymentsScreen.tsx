import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";
import { getPaymentStats } from "../domain/metrics/schoolMetrics";
import { useAdminData } from "../context/AdminDataContext";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPayments">;

export default function StudentPaymentsScreen({ route }: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const { paymentsData, studentsData } = useAdminData();
  const studentId = route?.params?.studentId ?? selectedStudentId;
  const student = studentId ? studentsData.find((item) => item.id === studentId) ?? getStudentById(studentId) : undefined;

  const paiementsEleve = paymentsData.filter(
    (paiement) => normalizeId(paiement.studentId) === normalizeId(studentId)
  );
  const sortedPayments = [...paiementsEleve].sort((left, right) => parsePaymentDate(right.date) - parsePaymentDate(left.date));
  const paymentStats = getPaymentStats(paiementsEleve);
  const expectedTuition = paymentStats.paidAmount + paymentStats.pendingAmount;

  return (
    <View style={styles.container}>
      <StudentSwitcher />
      <Text style={styles.title}>Historique de paiement</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>
      {student?.className ? <Text style={styles.classLabel}>Classe : {student.className}</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Frais scolaires attendus</Text>
        <Text style={styles.summaryValue}>{expectedTuition.toLocaleString()} FC</Text>
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Payé</Text>
          <Text style={styles.balanceValue}>{paymentStats.paidAmount.toLocaleString()} FC</Text>
        </View>
        <View style={[styles.balanceCard, styles.pendingCard]}>
          <Text style={styles.balanceLabel}>Reste à payer</Text>
          <Text style={[styles.balanceValue, styles.pendingValue]}>{paymentStats.pendingAmount.toLocaleString()} FC</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historique détaillé</Text>

      <FlatList
        data={sortedPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement enregistré.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{item.amount.toLocaleString()} FC</Text>
              <Text style={styles.meta}>Référence : {item.publicId ?? item.id}</Text>
              <Text style={styles.meta}>Date : {item.date}</Text>
              <Text style={styles.meta}>Mode : {item.method ?? "Non renseigné"}</Text>
            </View>
            <Text style={[styles.badge, item.status === "PAYE" ? styles.success : styles.warning]}>
              {item.status === "PAYE" ? "Payé" : "En attente"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function normalizeId(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function parsePaymentDate(value?: string) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getTime();
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
  title: { fontSize: 30, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  classLabel: { marginTop: 4, marginBottom: 20, color: "#2563EB", fontWeight: "800" },
  summaryCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  summaryLabel: { color: "#DBEAFE", fontWeight: "700" },
  summaryValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", marginTop: 6 },
  balanceRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  balanceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },
  pendingCard: { backgroundColor: "#FFF7ED" },
  balanceLabel: { color: "#64748B", fontWeight: "800" },
  balanceValue: { marginTop: 6, color: "#16A34A", fontWeight: "900", fontSize: 18 },
  pendingValue: { color: "#EA580C" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 12 },
  listContent: { paddingBottom: 80 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardContent: { flex: 1, minWidth: 0 },
  name: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  meta: { marginTop: 4, color: "#64748B", fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: "900", overflow: "hidden" },
  success: { backgroundColor: "#DCFCE7", color: "#166534" },
  warning: { backgroundColor: "#FEF3C7", color: "#92400E" },
  empty: { color: "#64748B", fontWeight: "700" },
});
