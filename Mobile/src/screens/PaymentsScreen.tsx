import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAdminData } from "../context/AdminDataContext";
import { getPaymentStats } from "../domain/metrics/schoolMetrics";
import { useAuth } from "../context/AuthContext";
import { canMutateEntity, canReadRoute } from "../domain/security/permissions";

export default function PaymentsScreen({ navigation }: any) {
  const { session } = useAuth();
  const { paymentsData, studentsData } = useAdminData();
  const paymentStats = getPaymentStats(paymentsData);
  const canCreate = canMutateEntity(session, "payments", "CREATE");
  const canUpdate = canMutateEntity(session, "payments", "UPDATE");
  const canReadStudentPayments = canReadRoute(session, "StudentPayments");
  const canOpenPaymentAdmin = canCreate || canUpdate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Paiements</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.summaryCard}
        onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments" })}
      >
        <Text style={styles.summaryLabel}>Montant encaissé ce mois</Text>
        <Text style={styles.summaryAmount}>{paymentStats.paidAmount.toLocaleString()} FC</Text>
        <Text style={styles.summarySub}>{paymentStats.rate}% des paiements réglés</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.smallCard}
          onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments" })}
        >
          <Text style={styles.smallNumber}>{paymentStats.paid}</Text>
          <Text style={styles.smallLabel}>Payés</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.smallCard}
          onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments" })}
        >
          <Text style={styles.smallNumber}>{paymentStats.pending}</Text>
          <Text style={styles.smallLabel}>Impayés</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Paiements récents</Text>

      {paymentsData.map((payment) => {
        const student = studentsData.find((item) => item.id === payment.studentId);
        const isPending = payment.status === "EN_ATTENTE";

        return (
          <TouchableOpacity
            key={payment.id}
            activeOpacity={0.85}
            style={styles.paymentCard}
            onPress={() =>
              student && canReadStudentPayments
                ? navigation.navigate("StudentPayments", { studentId: student.id })
                : canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments" })
            }
          >
            <View>
              <Text style={styles.name}>{student?.name ?? "Élève inconnu"}</Text>
              <Text style={styles.subtitle}>{payment.amount.toLocaleString()} FC • {payment.date}</Text>
            </View>

            <Text style={[styles.badge, isPending && styles.badgeDanger]}>
              {isPending ? "En attente" : "Payé"}
            </Text>
          </TouchableOpacity>
        );
      })}

      {canCreate && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.button}
          onPress={() => navigation.navigate("AdminCrud", { entity: "payments" })}
        >
          <Text style={styles.buttonText}>Enregistrer un paiement</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  summaryLabel: { color: "#DBEAFE", fontSize: 15 },
  summaryAmount: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", marginTop: 8 },
  summarySub: { color: "#E5E7EB", marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  smallCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  smallNumber: { fontSize: 26, fontWeight: "800", color: "#2563EB" },
  smallLabel: { color: "#6B7280", marginTop: 6 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginTop: 24, marginBottom: 14 },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 5, color: "#6B7280" },
  badge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: "700",
  },
  badgeDanger: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
