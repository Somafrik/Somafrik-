import { View, Text, StyleSheet } from "react-native";

export default function TeachersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enseignants</Text>
      <Text>Liste des enseignants ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
});