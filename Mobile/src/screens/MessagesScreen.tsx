import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { messageThemes } from "../data/catalog";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import StudentSwitcher from "../components/StudentSwitcher";

export default function MessagesScreen({ navigation }: any) {
  const { session, selectedStudentId } = useAuth();
  const { createItem, messagesData } = useAdminData();
  const [theme, setTheme] = useState(messageThemes[0]);
  const [message, setMessage] = useState("");
  const parentPhone =
    session?.user.parentPhone ??
    session?.user.children?.[0]?.parentPhone ??
    "";

  const parentMessages = useMemo(
    () => messagesData.filter((item) => item.parentPhone === parentPhone),
    [messagesData, parentPhone]
  );

  const sendMessage = () => {
    if (!parentPhone || !message.trim()) {
      Alert.alert("Message incomplet", "Veuillez écrire votre message avant l'envoi.");
      return;
    }

    createItem("messages", {
      id: `messages-${Date.now()}`,
      parentPhone,
      studentId: selectedStudentId ?? "",
      theme,
      direction: "Parent vers école",
      message: message.trim(),
      status: "Nouveau",
      date: formatDate(new Date()),
    });

    setMessage("");
    Alert.alert("Message envoyé", "L'école recevra votre demande.");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {session?.role === "parent_student" && <StudentSwitcher />}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>Échanges entre l'école et le parent</Text>
          </View>
          {session?.role === "school_admin" && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.adminButton}
              onPress={() => navigation.navigate("AdminCrud", { entity: "messages" })}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {session?.role === "parent_student" && (
          <View style={styles.composeCard}>
            <Text style={styles.cardTitle}>Écrire à l'école</Text>
            <Text style={styles.label}>Thème</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themeList}
            >
              {messageThemes.map((item) => {
                const selected = item === theme;

                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.85}
                    style={[styles.themeChip, selected && styles.themeChipActive]}
                    onPress={() => setTheme(item)}
                  >
                    <Text style={[styles.themeText, selected && styles.themeTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Expliquez votre demande..."
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.messageInput}
            />

            <TouchableOpacity activeOpacity={0.85} style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send-outline" size={20} color="#FFFFFF" />
              <Text style={styles.sendText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Historique</Text>
        {parentMessages.map((item) => {
          const fromSchool = item.direction === "École vers parent";

          return (
            <View key={item.id} style={styles.messageCard}>
              <View style={styles.messageTop}>
                <View style={[styles.directionIcon, fromSchool ? styles.schoolIcon : styles.parentIcon]}>
                  <Ionicons
                    name={fromSchool ? "school-outline" : "person-outline"}
                    size={18}
                    color={fromSchool ? "#2563EB" : "#0F766E"}
                  />
                </View>
                <View style={styles.messageHeaderText}>
                  <Text style={styles.messageTheme}>{item.theme}</Text>
                  <Text style={styles.messageMeta}>{item.direction} • {item.date}</Text>
                </View>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.messageBody}>{item.message}</Text>
            </View>
          );
        })}

        {parentMessages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={24} color="#94A3B8" />
            <Text style={styles.emptyText}>Aucun message pour ce compte.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#64748B", fontWeight: "700", marginTop: 4 },
  adminButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  composeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900", marginBottom: 12 },
  label: { color: "#334155", fontSize: 12, fontWeight: "900", marginBottom: 8 },
  themeList: { gap: 8, paddingRight: 4, marginBottom: 14 },
  themeChip: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  themeChipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  themeText: { color: "#475569", fontWeight: "800", fontSize: 12 },
  themeTextActive: { color: "#FFFFFF" },
  messageInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    textAlignVertical: "top",
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: 14,
  },
  sendButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  sendText: { color: "#FFFFFF", fontWeight: "900", marginLeft: 8 },
  sectionTitle: { color: "#0F172A", fontSize: 20, fontWeight: "900", marginBottom: 12 },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  messageTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  directionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  schoolIcon: { backgroundColor: "#EFF6FF" },
  parentIcon: { backgroundColor: "#ECFDF5" },
  messageHeaderText: { flex: 1 },
  messageTheme: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  messageMeta: { color: "#64748B", fontSize: 11, fontWeight: "700", marginTop: 3 },
  status: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900",
  },
  messageBody: { color: "#334155", fontWeight: "700", lineHeight: 20 },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },
  emptyText: { color: "#64748B", fontWeight: "800", marginTop: 8 },
});
