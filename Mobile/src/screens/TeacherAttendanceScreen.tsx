import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { presences } from "../data/catalog";
import { useAdminData } from "../context/AdminDataContext";

type AttendanceStatus = "Présent" | "Absent" | "Retard" | "Justifié";

type AttendanceEntry = {
  status: AttendanceStatus;
  arrivalTime?: string;
  reason?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  previousStatus?: AttendanceStatus;
};

type SavedCall = {
  id: string;
  className: string;
  course: string;
  teacherId: string;
  date: string;
  hour: string;
  entries: Record<string, AttendanceEntry>;
};

export default function TeacherAttendanceScreen({ navigation }: any) {
  const { session } = useAuth();
  const { studentsData } = useAdminData();
  const assignedClasses = session?.user.assignedClasses ?? [];
  const assignments = session?.user.assignments ?? [];
  const classStudents = studentsData.filter((student) => assignedClasses.includes(student.className));
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [savedCalls, setSavedCalls] = useState<SavedCall[]>([]);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceEntry>>(() =>
    Object.fromEntries(
      classStudents.map((student) => {
        const latest = [...presences]
          .reverse()
          .find((presence) => presence.studentId === student.id);
        return [
          student.id,
          {
            status: (latest?.status ?? (latest?.present ? "Présent" : "Présent")) as AttendanceStatus,
          },
        ];
      })
    )
  );

  const todayLabel = formatDate(new Date());
  const currentHour = formatHour(new Date());
  const selectedRows = selectedClass
    ? classStudents.filter((student) => student.className === selectedClass)
    : [];

  const dailyStats = useMemo(() => {
    const entries = selectedRows.map((student) => attendance[student.id]?.status ?? "Présent");
    const present = entries.filter((status) => status === "Présent").length;
    const absent = entries.filter((status) => status === "Absent").length;
    const late = entries.filter((status) => status === "Retard").length;
    const justified = entries.filter((status) => status === "Justifié").length;
    const rate = entries.length ? Math.round((present / entries.length) * 100) : 0;

    return { present, absent, late, justified, rate };
  }, [attendance, selectedRows]);

  const cycleAttendance = (studentId: string) => {
    setAttendance((current) => {
      const currentEntry = current[studentId] ?? { status: "Présent" };
      const nextStatus = getNextStatus(currentEntry.status);
      const nextEntry = buildEntry(nextStatus, currentEntry.status, session?.user.name ?? "Enseignant");

      setAuditLog((log) => [
        `${formatDate(new Date())} ${formatHour(new Date())} • ${studentId} : ${currentEntry.status} -> ${nextStatus}`,
        ...log.slice(0, 9),
      ]);

      return { ...current, [studentId]: nextEntry };
    });
  };

  const markClassPresent = (className: string) => {
    const rows = classStudents.filter((student) => student.className === className);
    setAttendance((current) => ({
      ...current,
      ...Object.fromEntries(
        rows.map((student) => [
          student.id,
          buildEntry("Présent", current[student.id]?.status, session?.user.name ?? "Enseignant"),
        ])
      ),
    }));
  };

  const saveCall = (className: string) => {
    const rows = classStudents.filter((student) => student.className === className);
    const classAssignments = assignments.filter((assignment) => assignment.className === className);
    const entries = Object.fromEntries(
      rows.map((student) => [student.id, attendance[student.id] ?? { status: "Présent" }])
    );
    const absentCount = Object.values(entries).filter((entry) => entry.status === "Absent").length;
    const lateCount = Object.values(entries).filter((entry) => entry.status === "Retard").length;
    const justifiedCount = Object.values(entries).filter((entry) => entry.status === "Justifié").length;

    setSavedCalls((current) => [
      {
        id: `CALL-${Date.now()}`,
        className,
        course: classAssignments[0]?.course ?? "Cours non renseigné",
        teacherId: session?.user.id ?? "",
        date: todayLabel,
        hour: currentHour,
        entries,
      },
      ...current,
    ]);

    Alert.alert(
      "Appel enregistré",
      `${className} • ${rows.length} élève(s)\n${absentCount} absent(s), ${lateCount} retard(s), ${justifiedCount} justifié(s).\nLes parents concernés seront notifiés.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Présences</Text>
      <Text style={styles.subtitle}>
        {selectedClass ? `Appel de ${selectedClass}` : "Sélectionnez une classe"} • {todayLabel} à {currentHour}
      </Text>

      {!selectedClass && (
        <>
          <Text style={styles.sectionTitle}>Mes classes</Text>
          {assignedClasses.map((className) => {
            const rows = classStudents.filter((student) => student.className === className);
            const classCourses = assignments
              .filter((assignment) => assignment.className === className)
              .map((assignment) => assignment.course);
            const savedCount = savedCalls.filter((call) => call.className === className).length;

            return (
              <TouchableOpacity
                key={className}
                activeOpacity={0.85}
                style={styles.selectClassCard}
                onPress={() => setSelectedClass(className)}
              >
                <View style={styles.selectClassIcon}>
                  <Ionicons name="grid-outline" size={24} color="#2563EB" />
                </View>
                <View style={styles.selectClassText}>
                  <Text style={styles.className}>{className}</Text>
                  <Text style={styles.meta}>{rows.length} élève(s) • {classCourses.join(", ") || "Cours non renseignés"}</Text>
                  <Text style={styles.meta}>{savedCount} appel(s) enregistré(s) aujourd'hui</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {selectedClass && (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backToClasses}
            onPress={() => setSelectedClass(null)}
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
            <Text style={styles.backToClassesText}>Changer de classe</Text>
          </TouchableOpacity>

          <View style={styles.dashboard}>
            <StatPill label="Présents" value={dailyStats.present} color="#16A34A" />
            <StatPill label="Absents" value={dailyStats.absent} color="#DC2626" />
            <StatPill label="Retards" value={dailyStats.late} color="#D97706" />
            <StatPill label="Taux" value={`${dailyStats.rate}%`} color="#2563EB" />
          </View>

      {[selectedClass].map((className) => {
        const rows = classStudents.filter((student) => student.className === className);
        const classCourses = assignments
          .filter((assignment) => assignment.className === className)
          .map((assignment) => assignment.course);
        const presentCount = rows.filter((student) => attendance[student.id]?.status === "Présent").length;
        const lateCount = rows.filter((student) => attendance[student.id]?.status === "Retard").length;
        const absentCount = rows.filter((student) => attendance[student.id]?.status === "Absent").length;

        return (
          <View key={className} style={styles.classCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.classHeader}
              onPress={() => navigation.navigate("Students", { className })}
            >
              <View>
                <Text style={styles.className}>{className}</Text>
                <Text style={styles.meta}>{classCourses.join(", ") || "Cours non renseignés"}</Text>
                <Text style={styles.meta}>
                  {presentCount}/{rows.length} présent(s) • {absentCount} absent(s) • {lateCount} retard(s)
                </Text>
              </View>
              <Ionicons name="checkbox-outline" size={24} color="#16A34A" />
            </TouchableOpacity>

            <View style={styles.classActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => markClassPresent(className)}>
                <Text style={styles.secondaryText}>Tout présent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => saveCall(className)}>
                <Text style={styles.saveText}>Enregistrer l'appel</Text>
              </TouchableOpacity>
            </View>

            {rows.map((student) => {
              const entry = attendance[student.id] ?? { status: "Présent" };
              const status = entry.status;

              return (
                <TouchableOpacity
                  key={student.id}
                  activeOpacity={0.85}
                  style={styles.studentRow}
                  onPress={() => cycleAttendance(student.id)}
                  onLongPress={() => navigation.navigate("StudentDetail", { studentId: student.id })}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentContent}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.meta}>
                      {student.matricule}
                      {entry.arrivalTime ? ` • arrivée ${entry.arrivalTime}` : ""}
                      {entry.reason ? ` • ${entry.reason}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.badge, getStatusStyle(status)]}>{status}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
        </>
      )}

      {selectedClass && (
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>Historique local</Text>
          <Text style={styles.meta}>
            {savedCalls.filter((call) => call.className === selectedClass).length} appel(s) enregistré(s) pour {selectedClass}
          </Text>
          {auditLog.slice(0, 3).map((row) => (
            <Text key={row} style={styles.auditRow}>{row}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildEntry(
  status: AttendanceStatus,
  previousStatus: AttendanceStatus | undefined,
  modifiedBy: string
): AttendanceEntry {
  return {
    status,
    previousStatus,
    modifiedBy,
    modifiedAt: `${formatDate(new Date())} ${formatHour(new Date())}`,
    arrivalTime: status === "Retard" ? formatHour(new Date()) : undefined,
    reason: status === "Justifié" ? "Maladie" : undefined,
  };
}

function getNextStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === "Présent") return "Absent";
  if (status === "Absent") return "Retard";
  if (status === "Retard") return "Justifié";
  return "Présent";
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function formatHour(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getStatusStyle(status: AttendanceStatus) {
  if (status === "Présent") return styles.success;
  if (status === "Retard") return styles.warning;
  if (status === "Justifié") return styles.info;
  return styles.danger;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 6, marginBottom: 16, color: "#64748B", fontWeight: "700" },
  sectionTitle: { color: "#0F172A", fontSize: 20, fontWeight: "900", marginBottom: 12 },
  selectClassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  selectClassIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectClassText: { flex: 1 },
  backToClasses: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  backToClassesText: { color: "#0F172A", fontWeight: "900", marginLeft: 8 },
  dashboard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statPill: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { color: "#64748B", fontWeight: "800", marginTop: 4 },
  classCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 16, marginBottom: 16 },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  className: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  meta: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  classActions: { flexDirection: "row", gap: 10, marginBottom: 8 },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#334155", fontWeight: "900" },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  saveText: { color: "#FFFFFF", fontWeight: "900" },
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
  warning: { backgroundColor: "#FEF3C7", color: "#92400E" },
  info: { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
  danger: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
  },
  reportTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" },
  auditRow: { color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 8 },
});
