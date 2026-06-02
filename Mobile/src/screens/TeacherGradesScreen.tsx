import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { courses, notes, students } from "../data/catalog";
import { GradeBookService } from "../domain/academics/GradeBookService";

export default function TeacherGradesScreen({ navigation }: any) {
  const { session } = useAuth();
  const assignments = session?.user.assignments ?? [];
  const gradeBook = new GradeBookService(students, notes, courses);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notes</Text>
      <Text style={styles.subtitle}>Vos cours par classe</Text>

      {assignments.map((assignment) => {
        const classStudents = students.filter((student) => student.className === assignment.className);
        const classStats = gradeBook.getClassStatistics(assignment.className);

        return (
          <View key={`${assignment.className}-${assignment.course}`} style={styles.assignmentCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.assignmentHeader}
              onPress={() => navigation.navigate("Students", { className: assignment.className })}
            >
              <View>
                <Text style={styles.assignmentTitle}>{assignment.course}</Text>
                <Text style={styles.meta}>{assignment.className} • {classStudents.length} élève(s)</Text>
              </View>
              <Ionicons name="reader-outline" size={24} color="#7C3AED" />
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{classStats.classAverage.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Moy. classe</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{classStats.bestAverage.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Meilleure</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{classStats.successRate}%</Text>
                <Text style={styles.statLabel}>Réussite</Text>
              </View>
            </View>

            {classStudents.map((student) => {
              const subjectAverage = gradeBook.getSubjectAverage(student.id, assignment.course);
              const report = gradeBook.generateReport(student.id);

              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.85}
                  style={styles.card}
                  onPress={() => navigation.navigate("StudentNotes", { studentId: student.id })}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="book-outline" size={24} color="#7C3AED" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.name}>{student.name}</Text>
                    <Text style={styles.meta}>{student.matricule}</Text>
                  </View>
                  <View style={styles.gradeBox}>
                    <Text style={styles.grade}>{subjectAverage.average ? subjectAverage.average.toFixed(1) : "-"}</Text>
                    <Text style={styles.gradeLabel}>{report.rankLabel}</Text>
                  </View>
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
  assignmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  assignmentTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 10,
  },
  statValue: { color: "#7C3AED", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#64748B", fontSize: 11, fontWeight: "800", marginTop: 2 },
  card: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  name: { fontSize: 17, fontWeight: "900", color: "#0F172A" },
  meta: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  gradeBox: { alignItems: "flex-end" },
  grade: { color: "#7C3AED", fontSize: 24, fontWeight: "900" },
  gradeLabel: { color: "#64748B", fontWeight: "800" },
});
