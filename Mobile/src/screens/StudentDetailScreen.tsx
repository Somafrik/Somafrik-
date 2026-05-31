import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getStudentById, notes, payments, presences } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "StudentDetail"
>;

export default function StudentDetailScreen({
  route,
  navigation,
}: Partial<Props>) {
  const { selectedStudentId } = useAuth();
  const studentId = selectedStudentId ?? route?.params?.studentId;

  const student = studentId ? getStudentById(studentId) : undefined;

  if (!student) {
    return (
      <View style={styles.container}>
        <Text>Élève introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StudentSwitcher />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.title}>{student.name}</Text>
          <Text style={styles.info}>Matricule : {student.matricule}</Text>
          <Text style={styles.info}>Sexe : {student.gender ?? "Non renseigné"}</Text>
          <Text style={styles.info}>Classe : {student.className}</Text>
          <Text style={styles.info}>Établissement : {student.schoolCode}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.statCard}
          onPress={() => navigation?.navigate("StudentNotes", { studentId: student.id })}
        >
          <Text style={styles.statValue}>
            {notes.filter((item) => item.studentId === student.id).length}
          </Text>
          <Text style={styles.statLabel}>Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.statCard}
          onPress={() => navigation?.navigate("StudentPresences", { studentId: student.id })}
        >
          <Text style={styles.statValue}>
            {presences.filter((item) => item.studentId === student.id && item.present).length}
          </Text>
          <Text style={styles.statLabel}>Présences</Text>
        </TouchableOpacity>
      </View>

      <StudentAction
        icon="book-outline"
        label="Notes"
        detail="Bulletins et évaluations"
        onPress={() => navigation?.navigate("StudentNotes", { studentId: student.id })}
      />

      <StudentAction
        icon="calendar-outline"
        label="Présences"
        detail="Suivi des absences"
        onPress={() => navigation?.navigate("StudentPresences", { studentId: student.id })}
      />

      <StudentAction
        icon="card-outline"
        label="Paiements"
        detail={`${payments.filter((item) => item.studentId === student.id).length} opération(s)`}
        onPress={() => navigation?.navigate("StudentPayments", { studentId: student.id })}
      />
    </ScrollView>
  );
}

type StudentActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
};

function StudentAction({ icon, label, detail, onPress }: StudentActionProps) {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color="#2563EB" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuText}>{label}</Text>
        <Text style={styles.menuDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2563EB",
  },
  profileInfo: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 10,
    color: "#0F172A",
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: "#64748B",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 18,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  statLabel: {
    color: "#CBD5E1",
    marginTop: 4,
    fontWeight: "700",
  },
  menuButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  menuDetail: {
    marginTop: 3,
    color: "#64748B",
    fontWeight: "600",
  },
});
