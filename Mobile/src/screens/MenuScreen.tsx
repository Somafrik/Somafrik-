import React from "react";
import { Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";
import { AdminEntity, useAdminData } from "../context/AdminDataContext";
import { canReadEntity, canReadRoute } from "../domain/security/permissions";

type MenuItem = {
  label: string;
  entity?: AdminEntity;
  route?: string;
  message?: string;
};

const adminMenuItems: MenuItem[] = [
  { label: "🌍 Pays", entity: "countries" },
  { label: "🏫 Établissements", entity: "schools" },
  { label: "📦 Abonnements", entity: "subscriptions" },
  { label: "👤 Utilisateurs", entity: "users" },
  { label: "👥 Élèves", entity: "students" },
  { label: "👨‍🏫 Enseignants", entity: "teachers" },
  { label: "📚 Classes", entity: "classes" },
  { label: "📖 Cours", entity: "courses" },
  { label: "🔁 Affectations profs", entity: "assignments" },
  { label: "💰 Paiements", entity: "payments" },
  { label: "⚙️ Statuts paiement", entity: "paymentStatuses" },
  { label: "💬 Messages parents", entity: "messages" },
  { label: "📢 Annonces", entity: "announcements" },
  { label: "🗓️ Emplois du temps", route: "Timetable" },
  { label: "📄 Bulletins", route: "ReportCards" },
  { label: "📄 Documents scolaires", message: "Module à livrer : certificats, attestations et relevés administratifs." },
  { label: "📊 Rapports", message: "Module à livrer : rapports académiques, financiers, présences et exports Excel/PDF." },
  { label: "🔐 Audit et connexions", message: "Module à livrer : journal des actions, historique des modifications et connexions." },
  { label: "🆘 Support", message: "Le module support sera connecté au centre d'assistance de l'école." },
];

const parentMenuItems: MenuItem[] = [
  { label: "👨‍👩‍👧 Compte parent", route: "Profil" },
  { label: "📚 Suivi scolaire", route: "Notes" },
  { label: "📄 Bulletins PDF", route: "ReportCards" },
  { label: "💰 Situation des frais", route: "FraisEleve" },
  { label: "📱 Paiement mobile", message: "Module à livrer : Mobile Money, carte bancaire, reçu automatique et historique des paiements." },
  { label: "💬 Messages école", route: "Messages" },
  { label: "📢 Annonces de l'école", route: "Announcements" },
  { label: "🔄 Mode hors ligne", message: "Module à livrer : consultation locale, synchronisation et résolution des conflits." },
  { label: "🆘 Support", message: "Le module support sera connecté au secrétariat de l'école." },
];

const studentMenuItems: MenuItem[] = [
  { label: "👤 Mon profil", route: "Profil" },
  { label: "📚 Mes notes", route: "Notes" },
  { label: "📄 Mes bulletins", route: "ReportCards" },
  { label: "✅ Mes présences", route: "Presences" },
  { label: "🗓️ Mon emploi du temps", route: "Timetable" },
  { label: "💰 Mes paiements", route: "FraisEleve" },
  { label: "📢 Annonces", route: "Announcements" },
  { label: "🔄 Mode hors ligne", message: "Module à livrer : consultation des notes, présences et annonces sans réseau." },
];

const teacherMenuItems: MenuItem[] = [
  { label: "👨‍🏫 Profil enseignant", message: "Votre profil enseignant sera disponible ici." },
  { label: "📚 Mes classes", route: "Classes" },
  { label: "✅ Appel des présences", route: "TeacherAttendance" },
  { label: "📝 Gestion des notes", route: "TeacherGrades" },
  { label: "📄 Bulletins", route: "ReportCards" },
  { label: "🗓️ Mon emploi du temps", route: "Timetable" },
  { label: "💬 Messages parents", route: "Messages" },
  { label: "📢 Annonces de l'école", route: "Announcements" },
  { label: "🔄 Synchronisation", message: "Module à livrer : saisie hors ligne des appels/notes puis synchronisation." },
  { label: "🆘 Support", message: "Le module support sera connecté à l'administration." },
];

function filterMenuItemsByPermission(session: any, items: MenuItem[]) {
  return items.filter((item) => {
    if (item.entity) return canReadEntity(session, item.entity);
    if (item.route) return canReadRoute(session, item.route);
    return true;
  });
}

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const { session, logout } = useAuth();
  const { messagesData, studentsData } = useAdminData();
  const isParentStudent = session?.role === "parent_student";
  const isStudent = session?.role === "student";
  const isTeacher = session?.role === "teacher";
  const unreadMessages = getUnreadMessagesCount(session, messagesData, studentsData);
  const menuItems = isStudent
    ? filterMenuItemsByPermission(session, studentMenuItems)
    : isParentStudent
    ? filterMenuItemsByPermission(session, parentMenuItems)
    : isTeacher
      ? filterMenuItemsByPermission(session, teacherMenuItems)
      : filterMenuItemsByPermission(session, adminMenuItems);

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
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
          <View style={styles.itemLabelBox}>
            <Text style={styles.itemText}>{item.label}</Text>
            {(item.entity === "messages" || item.route === "Messages") && unreadMessages > 0 && (
              <Text style={styles.badge}>{unreadMessages}</Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

function getUnreadMessagesCount(session: any, messagesData: any[], studentsData: any[]) {
  if (
    session?.role === "super_admin" ||
    session?.role === "school_admin" ||
    session?.role === "country_admin" ||
    session?.role === "principal" ||
    session?.role === "prefet" ||
    session?.role === "secretary"
  ) {
    return messagesData.filter(
      (message) => message.status === "Nouveau" && message.direction === "Parent vers école"
    ).length;
  }

  if (session?.role === "teacher") {
    const assignedClasses = session.user.assignedClasses ?? [];
    const teacherParents = studentsData
      .filter((student) => assignedClasses.includes(student.className))
      .map((student) => student.parentPhone);

    return messagesData.filter(
      (message) =>
        message.status === "Nouveau" &&
        (message.teacherId === session.user.id || teacherParents.includes(message.parentPhone)) &&
        message.direction === "Parent vers enseignant"
    ).length;
  }

  const parentPhone = session?.user.parentPhone ?? session?.user.children?.[0]?.parentPhone;

  return messagesData.filter(
    (message) =>
      message.status === "Nouveau" &&
      message.parentPhone === parentPhone &&
      (message.direction === "École vers parent" || message.direction === "Enseignant vers parent")
  ).length;
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
  itemLabelBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginLeft: 8,
  },
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
