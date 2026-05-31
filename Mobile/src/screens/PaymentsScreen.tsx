import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { payments, students } from "../data/catalog";

export default function PaymentsScreen() {
  const paidPayments = payments.filter((payment) => payment.status === "PAYE");
  const pendingPayments = payments.filter((payment) => payment.status === "EN_ATTENTE");
  const totalPaid = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Paiements</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Montant encaissé ce mois</Text>
        <Text style={styles.summaryAmount}>{totalPaid.toLocaleString()} FC</Text>
        <Text style={styles.summarySub}>
          {Math.round((paidPayments.length / payments.length) * 100)}% des paiements réglés
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.smallNumber}>{paidPayments.length}</Text>
          <Text style={styles.smallLabel}>Payés</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallNumber}>{pendingPayments.length}</Text>
          <Text style={styles.smallLabel}>Impayés</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Paiements récents</Text>

      {payments.map((payment) => {
        const student = students.find((item) => item.id === payment.studentId);
        const isPending = payment.status === "EN_ATTENTE";

        return (
          <View key={payment.id} style={styles.paymentCard}>
            <View>
              <Text style={styles.name}>{student?.name ?? "Élève inconnu"}</Text>
              <Text style={styles.subtitle}>{payment.amount.toLocaleString()} FC • {payment.date}</Text>
            </View>

            <Text style={[styles.badge, isPending && styles.badgeDanger]}>
              {isPending ? "En attente" : "Payé"}
            </Text>
          </View>
        );
      })}

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Enregistrer un paiement</Text>
      </TouchableOpacity>
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
