import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { eleves } from "../data/eleves";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "StudentDetail"
>;

export default function StudentDetailScreen({
  route,
  navigation,
}: Props) {
  const { studentId } = route.params;

  const eleve = eleves.find((e) => e.id === studentId);

  if (!eleve) {
    return (
      <View style={styles.container}>
        <Text>Élève introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{eleve.nom}</Text>

      <Text style={styles.info}>Matricule : {eleve.matricule}</Text>
      <Text style={styles.info}>Classe : {eleve.classe}</Text>
      <Text style={styles.info}>
        Établissement : {eleve.codeEtablissement}
      </Text>

     <TouchableOpacity
  style={styles.menuButton}
  onPress={() =>
    navigation.navigate("StudentNotes", {
      studentId: eleve.id,
    })
  }
>
  <Text style={styles.menuText}>📚 Notes</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.menuButton}
  onPress={() =>
    navigation.navigate("StudentPresences", {
      studentId: eleve.id,
    })
  }
>
  <Text style={styles.menuText}>📅 Présences</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.menuButton}
  onPress={() =>
    navigation.navigate("StudentPayments", {
      studentId: eleve.id,
    })
  }
>
  <Text style={styles.menuText}>💰 Paiements</Text>
</TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 8,
  },
  menuButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginTop: 15,
    elevation: 2,
  },
  menuText: {
    fontSize: 18,
    fontWeight: "600",
  },
});