import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { AdminEntity, useAdminData } from "../context/AdminDataContext";

type Props = NativeStackScreenProps<RootStackParamList, "AdminCrud">;

type Field = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "numeric";
};

const configs: Record<
  AdminEntity,
  {
    title: string;
    addLabel: string;
    fields: Field[];
  }
> = {
  students: {
    title: "Gestion des élèves",
    addLabel: "Ajouter un élève",
    fields: [
      { key: "name", label: "Nom", placeholder: "Nom complet" },
      { key: "matricule", label: "Matricule", placeholder: "MAT005" },
      { key: "className", label: "Classe", placeholder: "6ème A" },
      { key: "parentPhone", label: "Téléphone parent", placeholder: "+243 ..." },
    ],
  },
  teachers: {
    title: "Gestion des enseignants",
    addLabel: "Ajouter un enseignant",
    fields: [
      { key: "name", label: "Nom", placeholder: "Nom complet" },
      { key: "phone", label: "Téléphone", placeholder: "+243 ..." },
      {
        key: "assignments",
        label: "Classes et cours",
        placeholder: "6ème A:Mathématiques, 5ème A:Physique",
      },
    ],
  },
  classes: {
    title: "Gestion des classes",
    addLabel: "Ajouter une classe",
    fields: [
      { key: "name", label: "Nom de classe", placeholder: "4ème A" },
      { key: "teacherId", label: "Responsable", placeholder: "T1" },
    ],
  },
  payments: {
    title: "Gestion des paiements",
    addLabel: "Ajouter un paiement",
    fields: [
      { key: "studentId", label: "ID élève", placeholder: "1" },
      { key: "amount", label: "Montant", placeholder: "25000", keyboardType: "numeric" },
      { key: "date", label: "Date", placeholder: "2026-05-31" },
      { key: "status", label: "Statut", placeholder: "PAYE ou EN_ATTENTE" },
    ],
  },
  announcements: {
    title: "Gestion des annonces",
    addLabel: "Ajouter une annonce",
    fields: [
      { key: "title", label: "Titre", placeholder: "Réunion des parents" },
      { key: "message", label: "Message", placeholder: "Votre message" },
      { key: "date", label: "Date", placeholder: "2026-05-31" },
    ],
  },
};

export default function AdminCrudScreen({ route }: Props) {
  const { entity } = route.params;
  const { getItems, createItem, updateItem, deleteItem } = useAdminData();
  const config = configs[entity];
  const items = getItems(entity);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);

  const statsLabel = useMemo(() => `${items.length} élément(s)`, [items.length]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({});
    setVisible(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm(itemToForm(entity, item));
    setVisible(true);
  };

  const save = () => {
    const nextItem = formToItem(entity, form, editingItem?.id);

    if (!nextItem) {
      Alert.alert("Formulaire incomplet", "Veuillez remplir les champs principaux.");
      return;
    }

    if (editingItem) {
      updateItem(entity as any, nextItem as any);
    } else {
      createItem(entity as any, nextItem as any);
    }

    setVisible(false);
  };

  const confirmDelete = (item: any) => {
    Alert.alert("Supprimer", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteItem(entity, item.id),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{statsLabel}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {items.map((item: any) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{getPrimaryText(entity, item)}</Text>
              <Text style={styles.cardMeta}>{getSecondaryText(entity, item)}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(item)}>
              <Ionicons name="create-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonDanger} onPress={() => confirmDelete(item)}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? "Modifier" : config.addLabel}</Text>

            {config.fields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  value={form[field.key] ?? ""}
                  onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType ?? "default"}
                  style={styles.input}
                />
              </View>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={save}>
                <Text style={styles.saveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function itemToForm(entity: AdminEntity, item: any) {
  if (entity === "teachers") {
    return {
      name: item.name,
      phone: item.phone,
      assignments: (item.assignments ?? [])
        .map((assignment: any) => `${assignment.className}:${assignment.course}`)
        .join(", "),
    };
  }

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, String(value)])
  );
}

function formToItem(entity: AdminEntity, form: Record<string, string>, id?: string) {
  const nextId = id ?? `${entity}-${Date.now()}`;

  if (entity === "students") {
    if (!form.name || !form.matricule || !form.className) return null;
    return {
      id: nextId,
      name: form.name,
      matricule: form.matricule,
      className: form.className,
      schoolCode: "SCH001",
      parentPhone: form.parentPhone ?? "",
    };
  }

  if (entity === "teachers") {
    if (!form.name || !form.phone) return null;
    return {
      id: nextId,
      name: form.name,
      phone: form.phone,
      assignments: parseAssignments(form.assignments ?? ""),
    };
  }

  if (entity === "classes") {
    if (!form.name) return null;
    return { id: nextId, name: form.name, teacherId: form.teacherId ?? "" };
  }

  if (entity === "payments") {
    if (!form.studentId || !form.amount) return null;
    return {
      id: nextId,
      studentId: form.studentId,
      amount: Number(form.amount) || 0,
      date: form.date || new Date().toISOString().slice(0, 10),
      status: form.status === "EN_ATTENTE" ? "EN_ATTENTE" : "PAYE",
    };
  }

  if (!form.title || !form.message) return null;
  return {
    id: nextId,
    title: form.title,
    message: form.message,
    date: form.date || new Date().toISOString().slice(0, 10),
  };
}

function parseAssignments(value: string) {
  return value
    .split(",")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [className, course] = row.split(":").map((part) => part.trim());
      return { className: className ?? "", course: course ?? "" };
    })
    .filter((assignment) => assignment.className && assignment.course);
}

function getPrimaryText(entity: AdminEntity, item: any) {
  if (entity === "payments") return `${item.amount?.toLocaleString?.() ?? item.amount} FC`;
  if (entity === "announcements") return item.title;
  return item.name;
}

function getSecondaryText(entity: AdminEntity, item: any) {
  if (entity === "students") return `${item.matricule} • ${item.className}`;
  if (entity === "teachers") {
    return (item.assignments ?? [])
      .map((assignment: any) => `${assignment.className} - ${assignment.course}`)
      .join(" • ");
  }
  if (entity === "classes") return `Responsable : ${item.teacherId || "Non assigné"}`;
  if (entity === "payments") return `Élève ${item.studentId} • ${item.date} • ${item.status}`;
  return `${item.date} • ${item.message}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  cardMeta: { color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 4 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  iconButtonDanger: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  modalTitle: { color: "#0F172A", fontSize: 22, fontWeight: "900", marginBottom: 16 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { color: "#334155", fontSize: 12, fontWeight: "900", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
    fontWeight: "700",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  cancelText: { color: "#334155", fontWeight: "900" },
  saveText: { color: "#FFFFFF", fontWeight: "900" },
});
