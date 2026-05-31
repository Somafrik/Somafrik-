import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { classes, teachers } from "../data/catalog";

export default function TeachersScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Enseignants</Text>
      <Text style={styles.subtitle}>Équipe pédagogique active</Text>

      {teachers.map((teacher) => {
        const teacherClass = classes.find((item) => item.teacherId === teacher.id);

        return (
          <View key={teacher.id} style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="school-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.name}>{teacher.name}</Text>
              <Text style={styles.meta}>{teacher.subject}</Text>
              <Text style={styles.meta}>Classe : {teacherClass?.name ?? "Non assignée"}</Text>
            </View>
            <Text style={styles.phone}>{teacher.phone}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: "#64748B",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  meta: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "600",
  },
  phone: {
    color: "#2563EB",
    fontWeight: "800",
    maxWidth: 110,
    textAlign: "right",
  },
});
