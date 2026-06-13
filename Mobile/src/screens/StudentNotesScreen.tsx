import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";
import { GradeBookService } from "../domain/academics/GradeBookService";
import { useAdminData } from "../context/AdminDataContext";

type Props = NativeStackScreenProps<RootStackParamList, "StudentNotes">;

export default function StudentNotesScreen({ route, navigation }: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const { studentsData, notesData, coursesData } = useAdminData();
  const studentId = selectedStudentId ?? route?.params?.studentId;
  const student = studentId ? studentsData.find((item) => item.id === studentId) : undefined;
  const gradeBook = new GradeBookService(studentsData, notesData, coursesData);
  const studentNotes = notesData.filter((note) => note.studentId === studentId);
  const report = studentId ? gradeBook.generateReport(studentId, "Trimestre 1", "Publié") : undefined;

  return (
    <View style={styles.container}>
      <StudentSwitcher />
      <Text style={styles.title}>Notes</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.summaryCard}
        onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
      >
        <Text style={styles.summaryLabel}>Moyenne générale</Text>
        <Text style={styles.summaryValue}>{(report?.average ?? 0).toFixed(1)}/20</Text>
        <Text style={styles.summaryMeta}>
          {report?.rankLabel ?? "-"} • {report?.appreciation ?? "Aucune appréciation"}
        </Text>
      </TouchableOpacity>

      <View style={styles.reportRow}>
        <View style={styles.reportPill}>
          <Text style={styles.reportValue}>{(report?.totalPoints ?? 0).toFixed(1)}</Text>
          <Text style={styles.reportLabel}>Points</Text>
        </View>
        <View style={styles.reportPill}>
          <Text style={styles.reportValue}>{report?.totalCoefficients ?? 0}</Text>
          <Text style={styles.reportLabel}>Coefficients</Text>
        </View>
        <View style={styles.reportPill}>
          <Text style={styles.reportValue}>{report?.status ?? "Brouillon"}</Text>
          <Text style={styles.reportLabel}>Bulletin</Text>
        </View>
      </View>

      <FlatList
        data={studentNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Aucune note enregistrée.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
          >
            <View>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.meta}>
                Coef. {item.coefficient} • Barème {item.scale ?? 20} • {item.date}
              </Text>
              <Text style={styles.audit}>Saisi par {item.authorId ?? "N/A"} • {item.enteredAt ?? item.date}</Text>
            </View>
            <Text style={styles.grade}>{item.value}/20</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 22,
    marginTop: 20,
    marginBottom: 18,
  },
  summaryLabel: {
    color: "#DBEAFE",
    fontWeight: "700",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
  },
  summaryMeta: {
    color: "#DBEAFE",
    fontWeight: "800",
    marginTop: 4,
  },
  reportRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  reportPill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },
  reportValue: {
    color: "#0F172A",
    fontWeight: "900",
    fontSize: 16,
  },
  reportLabel: {
    color: "#64748B",
    fontWeight: "800",
    fontSize: 11,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subject: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  meta: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "600",
  },
  audit: {
    marginTop: 3,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  grade: {
    fontSize: 22,
    fontWeight: "900",
    color: "#16A34A",
  },
  empty: {
    color: "#64748B",
    fontWeight: "700",
  },
});
