import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById, presences } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPresences">;

export default function StudentPresencesScreen({ route }: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const studentId = selectedStudentId ?? route?.params?.studentId;
  const student = studentId ? getStudentById(studentId) : undefined;

  const presencesEleve = presences.filter(
    (presence) => presence.studentId === studentId
  );
  const presentCount = presencesEleve.filter((presence) => presence.present).length;
  const rate = presencesEleve.length
    ? Math.round((presentCount / presencesEleve.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StudentSwitcher />
      <Text style={styles.title}>Présences</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Taux de présence</Text>
        <Text style={styles.summaryValue}>{rate}%</Text>
      </View>

      <FlatList
        data={presencesEleve}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Aucune présence enregistrée.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.date}</Text>
            <Text style={[styles.badge, item.present ? styles.success : styles.danger]}>
              {item.present ? "Présent" : "Absent"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8FAFC" },
  title: { fontSize: 30, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#64748B", fontWeight: "700" },
  summaryCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  summaryLabel: { color: "#CBD5E1", fontWeight: "700" },
  summaryValue: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: { fontSize: 17, fontWeight: "900", color: "#0F172A" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: "900" },
  success: { backgroundColor: "#DCFCE7", color: "#166534" },
  danger: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  empty: { color: "#64748B", fontWeight: "700" },
});
