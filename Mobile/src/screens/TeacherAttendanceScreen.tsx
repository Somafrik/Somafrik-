import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { presences, students } from "../data/catalog";

export default function TeacherAttendanceScreen({ navigation }: any) {
  const { session } = useAuth();
  const assignedClasses = session?.user.assignedClasses ?? [];
  const assignments = session?.user.assignments ?? [];
  const classStudents = students.filter((student) => assignedClasses.includes(student.className));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Présences</Text>
      <Text style={styles.subtitle}>Appel des élèves de vos classes</Text>

      {assignedClasses.map((className) => {
        const rows = classStudents.filter((student) => student.className === className);
        const classCourses = assignments
          .filter((assignment) => assignment.className === className)
          .map((assignment) => assignment.course);
        const presentCount = rows.filter((student) =>
          presences.some((presence) => presence.studentId === student.id && presence.present)
        ).length;

        return (
          <View key={className} style={styles.classCard}>
            <View style={styles.classHeader}>
              <View>
                <Text style={styles.className}>{className}</Text>
                <Text style={styles.meta}>{classCourses.join(", ") || "Cours non renseignés"}</Text>
                <Text style={styles.meta}>{presentCount}/{rows.length} présent(s)</Text>
              </View>
              <Ionicons name="checkbox-outline" size={24} color="#16A34A" />
            </View>

            {rows.map((student) => {
              const latest = [...presences]
                .reverse()
                .find((presence) => presence.studentId === student.id);
              const present = latest?.present ?? false;

              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.85}
                  style={styles.studentRow}
                  onPress={() => navigation.navigate("StudentDetail", { studentId: student.id })}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentContent}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.meta}>{student.matricule}</Text>
                  </View>
                  <Text style={[styles.badge, present ? styles.success : styles.danger]}>
                    {present ? "Présent" : "Absent"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 6, marginBottom: 20, color: "#64748B", fontWeight: "700" },
  classCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, marginBottom: 16 },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  className: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  meta: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#2563EB", fontWeight: "900", fontSize: 18 },
  studentContent: { flex: 1 },
  studentName: { color: "#0F172A", fontWeight: "900", fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: "900" },
  success: { backgroundColor: "#DCFCE7", color: "#166534" },
  danger: { backgroundColor: "#FEE2E2", color: "#991B1B" },
});
