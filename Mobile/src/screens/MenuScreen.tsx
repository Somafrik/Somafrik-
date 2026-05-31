import React from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";
import { AdminEntity } from "../context/AdminDataContext";

type MenuItem = {
  label: string;
  entity?: AdminEntity;
  route?: string;
  message?: string;
};

const adminMenuItems: MenuItem[] = [
  { label: "👥 Élèves", entity: "students" },
  { label: "👨‍🏫 Enseignants", entity: "teachers" },
  { label: "📚 Classes", entity: "classes" },
  { label: "📖 Cours", entity: "courses" },
  { label: "🔁 Affectations profs", entity: "assignments" },
  { label: "💰 Paiements", entity: "payments" },
  { label: "⚙️ Statuts paiement", entity: "paymentStatuses" },
  { label: "💬 Messages parents", entity: "messages" },
  { label: "📢 Annonces", entity: "announcements" },
  { label: "🆘 Support", message: "Le module support sera connecté au centre d'assistance de l'école." },
];

const parentMenuItems: MenuItem[] = [
  { label: "👨‍👩‍👧 Compte parent", route: "Profil" },
  { label: "📚 Suivi scolaire", route: "Notes" },
  { label: "💰 Situation des frais", route: "FraisEleve" },
  { label: "💬 Messages école", route: "Messages" },
  { label: "📢 Annonces de l'école", route: "Announcements" },
  { label: "🆘 Support", message: "Le module support sera connecté au secrétariat de l'école." },
];

const teacherMenuItems: MenuItem[] = [
  { label: "👨‍🏫 Profil enseignant", message: "Votre profil enseignant sera disponible ici." },
  { label: "📚 Mes classes", route: "Classes" },
  { label: "✅ Appel des présences", route: "TeacherAttendance" },
  { label: "📝 Gestion des notes", route: "TeacherGrades" },
  { label: "📢 Annonces de l'école", route: "Announcements" },
  { label: "🆘 Support", message: "Le module support sera connecté à l'administration." },
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
        <TouchableOpacity
          key={item.label}
          style={styles.item}
          onPress={() => {
            if (item.entity) {
              navigation.navigate("AdminCrud", { entity: item.entity });
              return;
            }

            if (item.route) {
              navigation.navigate(item.route as never);
              return;
            }

            Alert.alert("Information", item.message ?? "Cette action sera disponible bientôt.");
          }}
        >
          <Text style={styles.itemText}>{item.label}</Text>
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
