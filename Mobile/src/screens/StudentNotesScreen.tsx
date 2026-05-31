import { View, Text, StyleSheet } from "react-native";

export default function StudentNotesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes de l’élève</Text>
      <Text>Les notes seront affichées ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
});