import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAdminData } from "../context/AdminDataContext";
import { getPaymentStats } from "../domain/metrics/schoolMetrics";
import { useAuth } from "../context/AuthContext";
import { canMutateEntity, canReadEntity } from "../domain/security/permissions";
import { useFloatingTabBarLayout } from "../lib/screenLayout";

export default function PaymentsScreen({ navigation }: any) {
  const { scrollContentPaddingBottom } = useFloatingTabBarLayout();
  const contentStyle = [styles.content, { paddingBottom: scrollContentPaddingBottom }];
  const { session } = useAuth();
  const { paymentsData, studentsData } = useAdminData();
  const paymentStats = getPaymentStats(paymentsData);
  const canCreate = canMutateEntity(session, "payments", "CREATE");
  const canUpdate = canMutateEntity(session, "payments", "UPDATE");
  const canReadPayments = canReadEntity(session, "payments");
  const canOpenPaymentAdmin = canReadPayments || canCreate || canUpdate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={contentStyle}>
      <Text style={styles.title}>Paiements</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.summaryCard}
        onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments" })}
      >
        <Text style={styles.summaryLabel}>Frais de scolarité estimés</Text>
        <Text style={styles.summaryAmount}>{(paymentStats.paidAmount + paymentStats.pendingAmount).toLocaleString()} FC</Text>
        <Text style={styles.summarySub}>Reste estimé : {paymentStats.pendingAmount.toLocaleString()} FC</Text>
      </TouchableOpacity>

      <View style={styles.summaryCardSecondary}>
        <Text style={styles.summaryLabelDark}>Montant encaissé</Text>
        <Text style={styles.summaryAmountDark}>{paymentStats.paidAmount.toLocaleString()} FC</Text>
        <Text style={styles.summarySubDark}>{paymentStats.rate}% des paiements réglés</Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.smallCard}
          onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments", filter: "paid" })}
        >
          <Text style={styles.smallNumber}>{paymentStats.paid}</Text>
          <Text style={styles.smallLabel}>Payés</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.smallCard}
          onPress={() => canOpenPaymentAdmin && navigation.navigate("AdminCrud", { entity: "payments", filter: "pending" })}
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
            style={styles.paymentCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("StudentPayments", { studentId: payment.studentId })}
          >
            <View style={styles.paymentContent}>
              <Text style={styles.name}>{student?.name ?? "Élève inconnu"}</Text>
              <Text style={styles.subtitle}>Montant : {payment.amount.toLocaleString()} FC</Text>
              <Text style={styles.subtitle}>Date : {payment.date} • Mode : {payment.method ?? "Non renseigné"}</Text>
              <Text style={styles.subtitle}>Référence : {payment.publicId ?? payment.id}</Text>
              <Text style={styles.historyHint}>Ouvrir l'historique et le reste à payer</Text>
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
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  summaryLabel: { color: "#DBEAFE", fontSize: 15 },
  summaryAmount: { color: "#FFFFFF", fontSize: 32, fontWeight: "800", marginTop: 8 },
  summaryAmountDark: { color: "#0F172A", fontSize: 32, fontWeight: "800", marginTop: 8 },
  summarySub: { color: "#E5E7EB", marginTop: 8 },
  summaryCardSecondary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  summaryLabelDark: { color: "#64748B", fontSize: 15, fontWeight: "700" },
  summarySubDark: { color: "#64748B", marginTop: 8 },
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
    alignItems: "flex-start",
    gap: 12,
  },
  paymentContent: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 5, color: "#6B7280" },
  historyHint: { marginTop: 8, color: "#2563EB", fontWeight: "800" },
  badge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: "700",
    overflow: "hidden",
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
