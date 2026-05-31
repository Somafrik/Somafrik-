import { View, Text, StyleSheet } from "react-native";

export default function AnnouncementsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annonces</Text>
      <Text>Liste des annonces ici.</Text>
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