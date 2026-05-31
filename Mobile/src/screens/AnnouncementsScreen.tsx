import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdminData } from "../context/AdminDataContext";

export default function AnnouncementsScreen({ navigation }: any) {
  const { announcementsData } = useAdminData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Annonces</Text>
      <Text style={styles.subtitle}>Communications envoyées aux familles</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.addButton}
        onPress={() => navigation.navigate("AdminCrud", { entity: "announcements" })}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Nouvelle annonce</Text>
      </TouchableOpacity>

      {announcementsData.map((announcement) => (
        <TouchableOpacity
          key={announcement.id}
          activeOpacity={0.85}
          style={styles.card}
          onPress={() => navigation.navigate("AdminCrud", { entity: "announcements" })}
        >
          <View style={styles.iconBox}>
            <Ionicons name="megaphone-outline" size={24} color="#7C3AED" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{announcement.title}</Text>
            <Text style={styles.message}>{announcement.message}</Text>
            <Text style={styles.date}>{announcement.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
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
  addButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
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
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  message: {
    marginTop: 6,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 20,
  },
  date: {
    marginTop: 8,
    color: "#7C3AED",
    fontWeight: "800",
  },
});
