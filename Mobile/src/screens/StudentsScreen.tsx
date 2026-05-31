import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { getPaymentRate, getPresenceRate, presences, students } from "../data/catalog";

export default function StudentsScreen({ route, navigation }: any) {
  const className = route?.params?.className ?? "Toutes les classes";
  const [query, setQuery] = useState("");

  const classStudents =
    className === "Toutes les classes"
      ? students
      : students.filter((student) => student.className === className);

  const filteredStudents = classStudents.filter((student) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.matricule.toLowerCase().includes(normalizedQuery)
    );
  });

  const presenceRate = getPresenceRate(classStudents.map((student) => student.id));
  const paymentRate = getPaymentRate(classStudents.map((student) => student.id));

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.title}>{className}</Text>
            <Text style={styles.subtitle}>
              {filteredStudents.length} élèves inscrits
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.addButton}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={22} color="#94A3B8" />
          <TextInput
            placeholder="Rechercher un élève"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryValue}>{filteredStudents.length}</Text>
            <Text style={styles.summaryLabel}>Élèves</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryValue}>{presenceRate}%</Text>
            <Text style={styles.summaryLabel}>Présence</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryValue}>{paymentRate}%</Text>
            <Text style={styles.summaryLabel}>Paiements</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Liste des élèves</Text>

        {filteredStudents.map((student) => {
          const lastPresence = [...presences]
            .reverse()
            .find((presence) => presence.studentId === student.id);
          const isPresent = lastPresence?.present ?? false;
          const status = isPresent ? "Présent" : "Absent";

          return (
            <TouchableOpacity
              key={student.id}
              activeOpacity={0.85}
              style={styles.studentCard}
              onPress={() =>
                navigation.navigate("StudentDetail", {
                  studentId: student.id,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {student.name.charAt(0)}
                </Text>
              </View>

              <View style={styles.studentContent}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentInfo}>{student.matricule}</Text>
                <Text style={styles.studentClass}>{student.className}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isPresent ? "#ECFDF5" : "#FEF2F2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isPresent ? "#16A34A" : "#DC2626",
                    },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 56,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  summaryCard: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#CBD5E1",
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
  },

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563EB",
  },

  studentContent: {
    flex: 1,
  },

  studentName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  studentInfo: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  studentClass: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
