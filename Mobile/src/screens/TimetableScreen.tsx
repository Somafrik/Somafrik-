import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTeacherById, timetable } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import { useAdminData } from "../context/AdminDataContext";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export default function TimetableScreen() {
  const { session, selectedStudentId } = useAuth();
  const { studentsData } = useAdminData();
  const rows = useMemo(() => {
    if (session?.role === "teacher") {
      const assignedClasses = session.user.assignedClasses ?? [];
      return timetable.filter((item) => assignedClasses.includes(item.className));
    }

    if ((session?.role === "parent_student" || session?.role === "student") && selectedStudentId) {
      const student = studentsData.find((item) => item.id === selectedStudentId);
      return timetable.filter((item) => item.className === student?.className);
    }

    return timetable;
  }, [selectedStudentId, session, studentsData]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Emploi du temps</Text>
      <Text style={styles.subtitle}>{rows.length} créneau(x) planifié(s)</Text>

      {days.map((day) => {
        const dayRows = rows.filter((item) => item.day === day);

        if (!dayRows.length) return null;

        return (
          <View key={day} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>{day}</Text>
            {dayRows.map((item) => {
              const teacher = getTeacherById(item.teacherId);

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.timeBox}>
                    <Text style={styles.time}>{item.startTime}</Text>
                    <Text style={styles.timeMuted}>{item.endTime}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.course}>{item.course}</Text>
                    <Text style={styles.meta}>{item.className} • {item.room}</Text>
                    <Text style={styles.meta}>{teacher?.name ?? "Enseignant à affecter"}</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={22} color="#2563EB" />
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  title: { color: "#0F172A", fontSize: 28, fontWeight: "900" },
  subtitle: { color: "#64748B", fontWeight: "800", marginTop: 4, marginBottom: 18 },
  dayBlock: { marginBottom: 18 },
  dayTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeBox: {
    width: 72,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    padding: 10,
    marginRight: 12,
  },
  time: { color: "#2563EB", fontWeight: "900", textAlign: "center" },
  timeMuted: { color: "#64748B", fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 3 },
  cardBody: { flex: 1, minWidth: 0 },
  course: { color: "#0F172A", fontSize: 16, fontWeight: "900" },
  meta: { color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 4 },
});
