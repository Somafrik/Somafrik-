import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";
import { getPresenceStats, normalizePresenceStatus } from "../domain/metrics/schoolMetrics";
import { useAdminData } from "../context/AdminDataContext";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPresences">;

export default function StudentPresencesScreen({ route, navigation }: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const { presencesData } = useAdminData();
  const studentId = selectedStudentId ?? route?.params?.studentId;
  const student = studentId ? getStudentById(studentId) : undefined;

  const presencesEleve = presencesData.filter(
    (presence) => presence.studentId === studentId
  );
  const presenceStats = getPresenceStats(presencesEleve);

  return (
    <View style={styles.container}>
      <StudentSwitcher />
      <Text style={styles.title}>Présences</Text>
      <Text style={styles.subtitle}>{student?.name ?? "Élève"}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.summaryCard}
        onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
      >
        <Text style={styles.summaryLabel}>Taux de présence</Text>
        <Text style={styles.summaryValue}>{presenceStats.rate}%</Text>
        <Text style={styles.summaryMeta}>
          {presenceStats.attended}/{presenceStats.total} présent(s), {presenceStats.justified} justifié(s)
        </Text>
      </TouchableOpacity>

      <FlatList
        data={presencesEleve}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Aucune présence enregistrée.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => studentId && navigation?.navigate("StudentDetail", { studentId })}
          >
            <Text style={styles.name}>{item.date}</Text>
            <Text style={[styles.badge, getPresenceStyle(normalizePresenceStatus(item))]}>
              {normalizePresenceStatus(item)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function getPresenceStyle(status: string) {
  if (status === "Présent") return styles.success;
  if (status === "Retard") return styles.warning;
  if (status === "Justifié") return styles.info;
  return styles.danger;
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
  summaryMeta: { color: "#CBD5E1", fontWeight: "700", marginTop: 6 },
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
  warning: { backgroundColor: "#FEF3C7", color: "#92400E" },
  info: { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
  danger: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  empty: { color: "#64748B", fontWeight: "700" },
});
