import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById, notes } from "../data/catalog";

type Props = NativeStackScreenProps<RootStackParamList, "StudentNotes">;

export default function StudentNotesScreen({ route }: Props) {
  const student = getStudentById(route.params.studentId);
  const studentNotes = notes.filter((note) => note.studentId === route.params.studentId);
  const average =
    studentNotes.length === 0
      ? 0
      : studentNotes.reduce((sum, note) => sum + note.value, 0) / studentNotes.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Moyenne générale</Text>
        <Text style={styles.summaryValue}>{average.toFixed(1)}/20</Text>
      </View>

      <FlatList
        data={studentNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Aucune note enregistrée.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.meta}>
                Coef. {item.coefficient} • {item.date}
              </Text>
            </View>
            <Text style={styles.grade}>{item.value}/20</Text>
          </View>
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
