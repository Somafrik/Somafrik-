import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function StudentSwitcher() {
  const { session, selectedStudentId, setSelectedStudentId } = useAuth();
  const children = session?.user.children ?? [];

  if (children.length <= 1) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enfant suivi</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {children.map((child) => {
          const selected = child.id === selectedStudentId;

          return (
            <TouchableOpacity
              key={child.id}
              activeOpacity={0.85}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setSelectedStudentId(child.id)}
            >
              <Text style={[styles.name, selected && styles.nameSelected]}>{child.name}</Text>
              <Text style={[styles.className, selected && styles.classNameSelected]}>
                {child.className}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  list: {
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipSelected: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  name: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  nameSelected: {
    color: "#FFFFFF",
  },
  className: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  classNameSelected: {
    color: "#CBD5E1",
  },
});
