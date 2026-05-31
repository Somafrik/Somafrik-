import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header SchoolLink
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.brand}>SchoolLink</Text>
            <Text style={styles.subtitle}>Smart Education Platform</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        </View> */}

        {/* Établissement */}
        <View style={styles.schoolCard}>
          <View style={styles.schoolIconBox}>
            <Ionicons name="school-outline" size={28} color="#2563EB" />
          </View>

          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>Université de Kinshasa</Text>
            <Text style={styles.schoolCity}>Kinshasa</Text>
            <Text style={styles.schoolTagline}>Excellence et Innovation</Text>
          </View>
        </View>

        {/* Bienvenue */}
        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeTitle}>Bonjour 👋</Text>
            <Text style={styles.welcomeText}>
              Bienvenue dans votre espace administrateur.
            </Text>
          </View>

          <View style={styles.welcomeIcon}>
            <Ionicons name="grid-outline" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vue d’ensemble</Text>
          <Text style={styles.sectionLink}>Aujourd’hui</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="people-outline"
            value="248"
            label="Élèves"
            color="#2563EB"
            bg="#EFF6FF"
          />

          <StatCard
            icon="person-outline"
            value="18"
            label="Enseignants"
            color="#7C3AED"
            bg="#F5F3FF"
          />

          <StatCard
            icon="checkmark-circle-outline"
            value="94%"
            label="Présence"
            color="#16A34A"
            bg="#ECFDF5"
          />

          <StatCard
            icon="card-outline"
            value="87%"
            label="Paiements"
            color="#EA580C"
            bg="#FFF7ED"
          />
        </View>

        {/* Activité récente */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <Text style={styles.sectionLink}>Voir tout</Text>
        </View>

        <View style={styles.activityCard}>
          <ActivityItem
            icon="cash-outline"
            title="Paiement reçu"
            description="Frais scolaires validés"
            color="#16A34A"
          />

          <ActivityItem
            icon="person-add-outline"
            title="Nouvelle inscription"
            description="Un nouvel élève ajouté"
            color="#2563EB"
          />

          <ActivityItem
            icon="megaphone-outline"
            title="Annonce publiée"
            description="Communication envoyée aux parents"
            color="#7C3AED"
          />
        </View>

        {/* Actions rapides */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
        </View>

        <View style={styles.actionsGrid}>
          <QuickAction icon="add-circle-outline" label="Ajouter élève" />
          <QuickAction icon="person-add-outline" label="Ajouter prof" />
          <QuickAction icon="card-outline" label="Paiement" />
          <QuickAction icon="megaphone-outline" label="Annonce" />
        </View>
      </ScrollView>
    </View>
  );
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
  bg: string;
};

function StatCard({ icon, value, label, color, bg }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type ActivityItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
};

function ActivityItem({ icon, title, description, color }: ActivityItemProps) {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={styles.activityTextBox}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward-outline" size={18} color="#CBD5E1" />
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

function QuickAction({ icon, label }: QuickActionProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.quickAction}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color="#2563EB" />
      </View>

      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  brand: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  schoolCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  schoolIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  schoolInfo: {
    flex: 1,
  },

  schoolName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  schoolCity: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  schoolTagline: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: "#14B8A6",
  },

  welcomeCard: {
    backgroundColor: "#1D4ED8",
    borderRadius: 30,
    padding: 22,
    minHeight: 128,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  welcomeText: {
    marginTop: 10,
    color: "#DBEAFE",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
    maxWidth: 230,
  },

  welcomeIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  sectionLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
    minHeight: 150,
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  statIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  statValue: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  statLabel: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: "#64748B",
  },

  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 8,
    marginBottom: 26,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
  },

  activityIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activityTextBox: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  activityDescription: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickAction: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  quickActionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
});