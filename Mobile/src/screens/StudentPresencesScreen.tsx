import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { presences } from "../data/presences";

type Props = NativeStackScreenProps<RootStackParamList, "StudentPresences">;

export default function StudentPresencesScreen({ route }: Props) {
  const { studentId } = route.params;

  const presencesEleve = presences.filter(
    (presence) => presence.eleveId === studentId
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Présences</Text>

      <FlatList
        data={presencesEleve}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.date}</Text>
            <Text>{item.present ? "Présent" : "Absent"}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold" },
});