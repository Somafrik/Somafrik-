import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const menuItems = [
  "🏫 Profil école",
  "⚙️ Paramètres",
  "👥 Utilisateurs",
  "📊 Rapports",
  "📢 Annonces",
  "🆘 Support",
];

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      {menuItems.map((item) => (
        <TouchableOpacity key={item} style={styles.item}>
          <Text style={styles.itemText}>{item}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB", padding: 20 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 24, color: "#111827" },
  item: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  chevron: { fontSize: 28, color: "#9CA3AF" },
  logout: {
    backgroundColor: "#EF4444",
    padding: 18,
    borderRadius: 18,
    marginTop: 20,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "800",
    textAlign: "center",
  },
});