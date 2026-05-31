import { useEffect, useMemo, useState } from "react";
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
import { messageThemes } from "../data/catalog";

type Props = NativeStackScreenProps<RootStackParamList, "AdminCrud">;

type Field = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  type?: "text" | "select" | "date";
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
      { key: "gender", label: "Sexe", placeholder: "Choisir le sexe", type: "select" },
      { key: "className", label: "Classe", placeholder: "Choisir une classe", type: "select" },
      { key: "parentPhone", label: "Téléphone parent", placeholder: "+243 ..." },
    ],
  },
  teachers: {
    title: "Gestion des enseignants",
    addLabel: "Ajouter un enseignant",
    fields: [
      { key: "id", label: "ID enseignant", placeholder: "T5" },
      { key: "name", label: "Nom", placeholder: "Nom complet" },
      { key: "gender", label: "Sexe", placeholder: "Choisir le sexe", type: "select" },
      { key: "phone", label: "Téléphone", placeholder: "+243 ..." },
    ],
  },
  classes: {
    title: "Gestion des classes",
    addLabel: "Ajouter une classe",
    fields: [
      { key: "name", label: "Nom de classe", placeholder: "4ème A" },
      { key: "teacherId", label: "Responsable", placeholder: "Choisir un enseignant", type: "select" },
    ],
  },
  courses: {
    title: "Gestion des cours",
    addLabel: "Ajouter un cours",
    fields: [
      { key: "className", label: "Classe", placeholder: "Choisir une classe", type: "select" },
      { key: "name", label: "Nom du cours", placeholder: "Mathématiques" },
      { key: "coefficient", label: "Coefficient", placeholder: "2", keyboardType: "numeric" },
    ],
  },
  assignments: {
    title: "Affectations profs",
    addLabel: "Affecter un cours",
    fields: [
      { key: "teacherId", label: "ID enseignant", placeholder: "Choisir un enseignant", type: "select" },
      { key: "className", label: "Classe", placeholder: "Choisir une classe", type: "select" },
      { key: "course", label: "Cours", placeholder: "Choisir un cours", type: "select" },
    ],
  },
  payments: {
    title: "Gestion des paiements",
    addLabel: "Ajouter un paiement",
    fields: [
      { key: "studentId", label: "ID élève", placeholder: "1" },
      { key: "amount", label: "Montant", placeholder: "25000", keyboardType: "numeric" },
      { key: "date", label: "Date", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "status", label: "Statut", placeholder: "Choisir un statut", type: "select" },
    ],
  },
  paymentStatuses: {
    title: "Statuts de paiement",
    addLabel: "Ajouter un statut",
    fields: [
      { key: "label", label: "Libellé", placeholder: "Payé" },
      { key: "value", label: "Code", placeholder: "PAYE" },
    ],
  },
  announcements: {
    title: "Gestion des annonces",
    addLabel: "Ajouter une annonce",
    fields: [
      { key: "title", label: "Titre", placeholder: "Réunion des parents" },
      { key: "message", label: "Message", placeholder: "Votre message" },
      { key: "date", label: "Date", placeholder: "JJ-MM-AAAA", type: "date" },
    ],
  },
  messages: {
    title: "Messages parents",
    addLabel: "Écrire à un parent",
    fields: [
      { key: "parentPhone", label: "Parent", placeholder: "Choisir un parent", type: "select" },
      { key: "studentId", label: "Élève", placeholder: "Choisir un élève", type: "select" },
      { key: "theme", label: "Thème", placeholder: "Choisir un thème", type: "select" },
      { key: "message", label: "Message", placeholder: "Message au parent" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "date", label: "Date", placeholder: "JJ-MM-AAAA", type: "date" },
    ],
  },
};

export default function AdminCrudScreen({ route }: Props) {
  const { entity } = route.params;
  const {
    getItems,
    createItem,
    updateItem,
    deleteItem,
    studentsData,
    teachersData,
    classesData,
    coursesData,
    assignmentsData,
    paymentStatusesData,
  } = useAdminData();
  const config = configs[entity];
  const items = getItems(entity);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [selectField, setSelectField] = useState<Field | null>(null);
  const [selectedCourseClass, setSelectedCourseClass] = useState("");
  const [dateField, setDateField] = useState<Field | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    if (entity === "courses" && !selectedCourseClass && classesData.length > 0) {
      setSelectedCourseClass(classesData[0].name);
    }
  }, [classesData, entity, selectedCourseClass]);

  const visibleItems = useMemo(() => {
    if (entity !== "courses" || !selectedCourseClass) {
      return items;
    }

    return items.filter((item: any) => normalize(item.className) === normalize(selectedCourseClass));
  }, [entity, items, selectedCourseClass]);

  const statsLabel = useMemo(() => `${visibleItems.length} élément(s)`, [visibleItems.length]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      ...getInitialForm(entity),
      ...(entity === "courses" && selectedCourseClass
        ? { className: selectedCourseClass }
        : {}),
    });
    setVisible(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm(itemToForm(entity, item));
    if (entity === "courses") {
      setSelectedCourseClass(item.className);
    }
    setVisible(true);
  };

  const save = () => {
    const nextItem = formToItem(entity, form, editingItem?.id);

    if (!nextItem) {
      Alert.alert("Formulaire incomplet", "Veuillez remplir les champs principaux.");
      return;
    }

    const businessError = validateBusinessRules({
      entity,
      item: nextItem,
      editingId: editingItem?.id,
      teachersData,
      classesData,
      coursesData,
      assignmentsData,
    });

    if (businessError) {
      Alert.alert("Règle métier", businessError);
      return;
    }

    if (editingItem) {
      updateItem(entity as any, nextItem as any);
    } else {
      createItem(entity as any, nextItem as any);
    }

    if (entity === "courses") {
      setSelectedCourseClass(String(nextItem.className ?? ""));
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
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{statsLabel}</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {entity === "courses" && (
          <View style={styles.classCardsBlock}>
            <Text style={styles.blockLabel}>Choisir une classe</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classCardsList}
            >
              {classesData.map((schoolClass) => {
                const selected = normalize(schoolClass.name) === normalize(selectedCourseClass);
                const courseCount = items.filter(
                  (item: any) => normalize(item.className) === normalize(schoolClass.name)
                ).length;

                return (
                  <TouchableOpacity
                    key={schoolClass.id}
                    activeOpacity={0.85}
                    style={[styles.classCard, selected && styles.classCardSelected]}
                    onPress={() => setSelectedCourseClass(schoolClass.name)}
                  >
                    <Text style={[styles.classCardTitle, selected && styles.classCardTitleSelected]}>
                      {schoolClass.name}
                    </Text>
                    <Text style={[styles.classCardMeta, selected && styles.classCardMetaSelected]}>
                      {courseCount} cours
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.courseHeader}>
              <Text style={styles.courseHeaderTitle}>
                Cours de {selectedCourseClass || "la classe"}
              </Text>
              <Text style={styles.courseHeaderMeta}>{visibleItems.length} cours</Text>
            </View>
          </View>
        )}

        {visibleItems.map((item: any) => (
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

        {visibleItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={22} color="#94A3B8" />
            <Text style={styles.emptyText}>Aucun élément pour cette sélection</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? "Modifier" : config.addLabel}</Text>

            {config.fields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.type === "select" ? (
                  <TouchableOpacity
                    style={styles.selectInput}
                    activeOpacity={0.85}
                    onPress={() => setSelectField(field)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !form[field.key] && styles.selectPlaceholder,
                      ]}
                    >
                      {form[field.key] || field.placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>
                ) : field.type === "date" ? (
                  <TouchableOpacity
                    style={styles.selectInput}
                    activeOpacity={0.85}
                    onPress={() => {
                      setCalendarMonth(parseDisplayDate(form[field.key]) ?? new Date());
                      setDateField(field);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !form[field.key] && styles.selectPlaceholder,
                      ]}
                    >
                      {form[field.key] || field.placeholder}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    value={form[field.key] ?? ""}
                    onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                    placeholder={field.placeholder}
                    keyboardType={field.keyboardType ?? "default"}
                    style={styles.input}
                  />
                )}
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

      <Modal
        visible={Boolean(selectField)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectField(null)}
      >
        <View style={styles.selectorBackdrop}>
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>{selectField?.label}</Text>
            <ScrollView style={styles.selectorList}>
              {getSelectOptions(
                selectField?.key,
                entity,
                studentsData,
                teachersData,
                classesData,
                coursesData,
                paymentStatusesData,
                form
              ).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.selectorOption}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (selectField) {
                      setForm((current) => ({
                        ...current,
                        [selectField.key]: option,
                        ...(entity === "assignments" && selectField.key === "className"
                          ? { course: "" }
                          : {}),
                      }));
                    }
                    setSelectField(null);
                  }}
                >
                  <Text style={styles.selectorOptionText}>{option}</Text>
                  {form[selectField?.key ?? ""] === option && (
                    <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.selectorCancel} onPress={() => setSelectField(null)}>
              <Text style={styles.cancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(dateField)}
        transparent
        animationType="fade"
        onRequestClose={() => setDateField(null)}
      >
        <View style={styles.selectorBackdrop}>
          <View style={styles.selectorCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNav}
                onPress={() => setCalendarMonth(addMonths(calendarMonth, -1))}
              >
                <Ionicons name="chevron-back" size={20} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.selectorTitle}>{formatMonth(calendarMonth)}</Text>
              <TouchableOpacity
                style={styles.calendarNav}
                onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              >
                <Ionicons name="chevron-forward" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {buildCalendarDays(calendarMonth).map((day, index) => (
                <TouchableOpacity
                  key={`${day?.toISOString() ?? "empty"}-${index}`}
                  disabled={!day}
                  style={[styles.dayCell, !day && styles.dayCellEmpty]}
                  onPress={() => {
                    if (day && dateField) {
                      setForm((current) => ({ ...current, [dateField.key]: formatDate(day) }));
                    }
                    setDateField(null);
                  }}
                >
                  <Text style={styles.dayText}>{day ? day.getDate() : ""}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.selectorCancel} onPress={() => setDateField(null)}>
              <Text style={styles.cancelText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function itemToForm(entity: AdminEntity, item: any) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, String(value)])
  );
}

function getInitialForm(entity: AdminEntity): Record<string, string> {
  if (entity === "teachers") {
    return {
      id: `T${Date.now().toString().slice(-4)}`,
    };
  }

  return {};
}

function formToItem(entity: AdminEntity, form: Record<string, string>, id?: string) {
  const nextId = id ?? `${entity}-${Date.now()}`;

  if (entity === "students") {
    if (!form.name || !form.matricule || !form.className) return null;
    return {
      id: nextId,
      name: form.name,
      matricule: form.matricule,
      gender: form.gender || "Non renseigné",
      className: form.className,
      schoolCode: "SCH001",
      parentPhone: form.parentPhone ?? "",
    };
  }

  if (entity === "teachers") {
    if (!form.id || !form.name || !form.phone) return null;
    return {
      id: form.id.trim(),
      name: form.name,
      gender: form.gender || "Non renseigné",
      phone: form.phone,
      assignments: [],
    };
  }

  if (entity === "classes") {
    if (!form.name) return null;
    return { id: nextId, name: form.name, teacherId: form.teacherId ?? "" };
  }

  if (entity === "courses") {
    if (!form.className || !form.name) return null;
    return {
      id: nextId,
      className: form.className,
      name: form.name,
      coefficient: Number(form.coefficient) || 1,
    };
  }

  if (entity === "assignments") {
    if (!form.teacherId || !form.className || !form.course) return null;
    return {
      id: nextId,
      teacherId: form.teacherId,
      className: form.className,
      course: form.course,
    };
  }

  if (entity === "payments") {
    if (!form.studentId || !form.amount) return null;
    return {
      id: nextId,
      studentId: form.studentId,
      amount: Number(form.amount) || 0,
      date: form.date || formatDate(new Date()),
      status: form.status || "PAYE",
    };
  }

  if (entity === "paymentStatuses") {
    if (!form.label || !form.value) return null;
    return {
      id: nextId,
      label: form.label,
      value: form.value.trim().toUpperCase().replace(/\s+/g, "_"),
    };
  }

  if (entity === "messages") {
    if (!form.parentPhone || !form.theme || !form.message) return null;
    return {
      id: nextId,
      parentPhone: form.parentPhone,
      studentId: form.studentId ?? "",
      teacherId: "",
      theme: form.theme,
      direction: "École vers parent",
      message: form.message,
      status: form.status || "Nouveau",
      date: form.date || formatDate(new Date()),
    };
  }

  if (!form.title || !form.message) return null;
  return {
    id: nextId,
    title: form.title,
    message: form.message,
    date: form.date || formatDate(new Date()),
  };
}

function getPrimaryText(entity: AdminEntity, item: any) {
  if (entity === "payments") return `${item.amount?.toLocaleString?.() ?? item.amount} FC`;
  if (entity === "paymentStatuses") return item.label;
  if (entity === "announcements") return item.title;
  if (entity === "assignments") return `${item.className} - ${item.course}`;
  if (entity === "messages") return item.theme;
  return item.name;
}

function getSecondaryText(entity: AdminEntity, item: any) {
  if (entity === "students") return `${item.matricule} • ${item.gender ?? "Sexe non renseigné"} • ${item.className}`;
  if (entity === "teachers") {
    return `ID : ${item.id} • ${item.gender ?? "Sexe non renseigné"} • ${item.phone}`;
  }
  if (entity === "classes") return `Responsable : ${item.teacherId || "Non assigné"}`;
  if (entity === "courses") return `${item.className} • Coefficient : ${item.coefficient}`;
  if (entity === "assignments") return `Enseignant : ${item.teacherId}`;
  if (entity === "paymentStatuses") return `Code : ${item.value}`;
  if (entity === "payments") return `Élève ${item.studentId} • ${item.date} • ${item.status}`;
  if (entity === "messages") {
    return `${item.direction} • ${item.parentPhone} • ${item.status} • ${item.date}`;
  }
  return `${item.date} • ${item.message}`;
}

type BusinessValidationInput = {
  entity: AdminEntity;
  item: any;
  editingId?: string;
  teachersData: any[];
  classesData: any[];
  coursesData: any[];
  assignmentsData: any[];
};

function validateBusinessRules({
  entity,
  item,
  editingId,
  teachersData,
  classesData,
  coursesData,
  assignmentsData,
}: BusinessValidationInput) {
  if (entity === "classes") {
    const teacherId = normalize(item.teacherId);

    if (!teacherId) {
      return null;
    }

    const teacherExists = teachersData.some((teacher) => normalize(teacher.id) === teacherId);

    if (!teacherExists) {
      return "Classe impossible : cet ID responsable n'est pas enregistré dans les enseignants.";
    }

    return null;
  }

  if (entity !== "assignments") {
    return null;
  }

  const teacherId = normalize(item.teacherId);
  const className = normalize(item.className);
  const course = normalize(item.course);
  const teacherExists = teachersData.some((teacher) => normalize(teacher.id) === teacherId);
  const classExists = classesData.some((schoolClass) => normalize(schoolClass.name) === className);
  const courseExists = coursesData.some(
    (courseItem) =>
      normalize(courseItem.name) === course &&
      normalize(courseItem.className) === className
  );

  if (!teacherExists) {
    return "Affectation impossible : cet ID enseignant n'est pas enregistré dans le système.";
  }

  if (!courseExists) {
    return "Affectation impossible : ce cours n'existe pas dans le système.";
  }

  if (!classExists) {
    return "Affectation impossible : cette classe n'existe pas dans le système.";
  }

  const duplicate = assignmentsData.find(
    (assignment) =>
      assignment.id !== editingId &&
      normalize(assignment.className) === className &&
      normalize(assignment.course) === course
  );

  if (duplicate) {
    if (normalize(duplicate.teacherId) === teacherId) {
      return `Affectation impossible : cet enseignant est déjà affecté au cours ${item.course} pour la classe ${item.className}.`;
    }

    return `Affectation impossible : le cours ${item.course} est déjà affecté à un autre professeur pour la classe ${item.className}.`;
  }

  return null;
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getSelectOptions(
  key: string | undefined,
  entity: AdminEntity,
  studentsData: any[],
  teachersData: any[],
  classesData: any[],
  coursesData: any[],
  paymentStatusesData: any[],
  form: Record<string, string>
) {
  if (key === "gender") {
    return ["Masculin", "Féminin"];
  }

  if (key === "teacherId") {
    return teachersData.map((teacher) => teacher.id).filter(Boolean);
  }

  if (key === "parentPhone") {
    return [...new Set(studentsData.map((student) => student.parentPhone).filter(Boolean))];
  }

  if (key === "studentId") {
    return studentsData
      .filter((student) => !form.parentPhone || student.parentPhone === form.parentPhone)
      .map((student) => student.id)
      .filter(Boolean);
  }

  if (key === "theme") {
    return messageThemes;
  }

  if (key === "className") {
    return classesData.map((schoolClass) => schoolClass.name).filter(Boolean);
  }

  if (key === "course") {
    const selectedClass = normalize(form.className);
    return coursesData
      .filter((course) => !selectedClass || normalize(course.className) === selectedClass)
      .map((course) => course.name)
      .filter(Boolean);
  }

  if (key === "status") {
    if (entity === "messages") {
      return ["Nouveau", "En cours", "Traité"];
    }

    return paymentStatusesData.map((status) => status.value).filter(Boolean);
  }

  return [];
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function parseDisplayDate(value?: string) {
  if (!value) return null;
  const [day, month, year] = value.split("-").map(Number);

  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarDays(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: Array<Date | null> = Array(startOffset).fill(null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(date.getFullYear(), date.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, color: "#64748B", fontWeight: "700" },
  addButton: {
    minWidth: 104,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  classCardsBlock: {
    marginBottom: 14,
  },
  blockLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },
  classCardsList: {
    gap: 10,
    paddingRight: 4,
  },
  classCard: {
    minWidth: 132,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  classCardSelected: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  classCardTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  classCardTitleSelected: {
    color: "#FFFFFF",
  },
  classCardMeta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  classCardMetaSelected: {
    color: "#CBD5E1",
  },
  courseHeader: {
    marginTop: 14,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseHeaderTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  courseHeaderMeta: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
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
  selectInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: "#0F172A",
    fontWeight: "800",
  },
  selectPlaceholder: {
    color: "#94A3B8",
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
  selectorBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  selectorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    maxHeight: "72%",
  },
  selectorTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calendarNav: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayText: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 34,
  },
  selectorList: {
    marginBottom: 12,
  },
  selectorOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorOptionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  selectorCancel: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
});
