import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const payments = [
  { id: "1", name: "Jean Kabeya", amount: "120 €", status: "Payé" },
  { id: "2", name: "Marie Mukendi", amount: "90 €", status: "Impayé" },
  { id: "3", name: "Patrick Okito", amount: "150 €", status: "Payé" },
];

export default function PaymentsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Paiements</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Montant encaissé ce mois</Text>
        <Text style={styles.summaryAmount}>450 000 €</Text>
        <Text style={styles.summarySub}>87% des paiements réglés</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.smallNumber}>320</Text>
          <Text style={styles.smallLabel}>Payés</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallNumber}>48</Text>
          <Text style={styles.smallLabel}>Impayés</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Paiements récents</Text>

      {payments.map((payment) => (
        <View key={payment.id} style={styles.paymentCard}>
          <View>
            <Text style={styles.name}>{payment.name}</Text>
            <Text style={styles.subtitle}>{payment.amount}</Text>
          </View>

          <Text
            style={[
              styles.badge,
              payment.status === "Impayé" && styles.badgeDanger,
            ]}
          >
            {payment.status}
          </Text>
        </View>
      ))}

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