import { Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
};

export default function MenuCard({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
  },
});