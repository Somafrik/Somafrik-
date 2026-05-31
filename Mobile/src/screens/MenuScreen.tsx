import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";

const adminMenuItems = [
  "🏫 Profil école",
  "⚙️ Paramètres",
  "👥 Utilisateurs",
  "📊 Rapports",
  "📢 Annonces",
  "🆘 Support",
];

const parentMenuItems = [
  "👨‍👩‍👧 Compte parent",
  "📚 Suivi scolaire",
  "💰 Situation des frais",
  "📢 Annonces de l'école",
  "🆘 Support",
];

const teacherMenuItems = [
  "👨‍🏫 Profil enseignant",
  "📚 Mes classes",
  "✅ Appel des présences",
  "📝 Gestion des notes",
  "📢 Annonces de l'école",
  "🆘 Support",
];

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const { session, logout } = useAuth();
  const isParentStudent = session?.role === "parent_student";
  const isTeacher = session?.role === "teacher";
  const menuItems = isParentStudent
    ? parentMenuItems
    : isTeacher
      ? teacherMenuItems
      : adminMenuItems;

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "RoleSelection" }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <Text style={styles.userName}>{session?.user.name ?? "Utilisateur"}</Text>

      {isParentStudent && (
        <>
          <StudentSwitcher />
          <Text style={styles.childrenCount}>
            {session?.user.children?.length ?? 0} enfant(s) lié(s) à ce compte
          </Text>
        </>
      )}

      {isTeacher && (
        <Text style={styles.childrenCount}>
          {(session?.user.courses ?? []).join(", ")} • {(session?.user.assignedClasses ?? []).join(", ")}
        </Text>
      )}

      {menuItems.map((item) => (
        <TouchableOpacity key={item} style={styles.item}>
          <Text style={styles.itemText}>{item}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB", padding: 20 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 24, color: "#111827" },
  userName: {
    marginTop: -16,
    marginBottom: 18,
    color: "#64748B",
    fontWeight: "700",
  },
  childrenCount: {
    color: "#2563EB",
    fontWeight: "800",
    marginTop: -8,
    marginBottom: 14,
  },
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
