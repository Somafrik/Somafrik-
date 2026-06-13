import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { AdminEntity, useAdminData } from "../context/AdminDataContext";
import { messageThemes, rolePermissions } from "../data/catalog";
import { useAuth } from "../context/AuthContext";
import { canMutateEntity, canReadEntity } from "../domain/security/permissions";
import { resetUserPassword as resetUserPasswordOnBackend } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "AdminCrud">;

type Field = {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  type?: "text" | "select" | "date" | "photo";
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
      { key: "firstName", label: "Prénom", placeholder: "Prénom" },
      { key: "gender", label: "Sexe", placeholder: "Choisir le sexe", type: "select" },
      { key: "birthDate", label: "Date de naissance", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "className", label: "Classe", placeholder: "Choisir une classe", type: "select" },
      { key: "parentName", label: "Nom du parent", placeholder: "Nom complet du parent" },
      { key: "parentPhone", label: "Téléphone parent", placeholder: "+243 ..." },
      { key: "parentEmail", label: "Email parent", placeholder: "parent@email.com" },
    ],
  },
  teachers: {
    title: "Gestion des enseignants",
    addLabel: "Ajouter un enseignant",
    fields: [
      { key: "name", label: "Nom", placeholder: "Nom complet" },
      { key: "firstName", label: "Prénom", placeholder: "Prénom" },
      { key: "gender", label: "Sexe", placeholder: "Choisir le sexe", type: "select" },
      { key: "phone", label: "Téléphone", placeholder: "+243 ..." },
      { key: "email", label: "Email", placeholder: "enseignant@email.com" },
      { key: "mainSubject", label: "Matière principale", placeholder: "Mathématiques" },
    ],
  },
  classes: {
    title: "Gestion des classes",
    addLabel: "Ajouter une classe",
    fields: [
      { key: "name", label: "Nom de classe", placeholder: "4ème A" },
      { key: "level", label: "Niveau", placeholder: "4ème" },
      { key: "track", label: "Filière", placeholder: "Générale" },
      { key: "teacherId", label: "Responsable", placeholder: "Choisir un enseignant", type: "select" },
    ],
  },
  countries: {
    title: "Gestion des pays",
    addLabel: "Ajouter un pays",
    fields: [
      { key: "name", label: "Pays", placeholder: "République Démocratique du Congo" },
      { key: "code", label: "Code ISO", placeholder: "CD" },
      { key: "phonePrefix", label: "Indicatif", placeholder: "+243" },
      { key: "currency", label: "Devise", placeholder: "CDF" },
      { key: "timezone", label: "Fuseau horaire", placeholder: "Africa/Kinshasa" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "administratorId", label: "Admin pays", placeholder: "Choisir un utilisateur", type: "select" },
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
      { key: "method", label: "Mode de paiement", placeholder: "Choisir un mode", type: "select" },
    ],
  },
  subscriptions: {
    title: "Gestion des abonnements",
    addLabel: "Ajouter un abonnement",
    fields: [
      { key: "schoolCode", label: "Établissement", placeholder: "Choisir l'établissement", type: "select" },
      { key: "countryCode", label: "Code pays", placeholder: "CD" },
      { key: "country", label: "Pays", placeholder: "RDC" },
      { key: "plan", label: "Offre", placeholder: "Choisir le plan", type: "select" },
      { key: "monthlyPrice", label: "Mensuel", placeholder: "120", keyboardType: "numeric" },
      { key: "annualPrice", label: "Annuel", placeholder: "1200", keyboardType: "numeric" },
      { key: "currency", label: "Devise", placeholder: "USD" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "paymentStatus", label: "Paiement", placeholder: "Choisir le statut", type: "select" },
      { key: "startDate", label: "Début", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "endDate", label: "Fin", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "lastPaymentDate", label: "Dernier paiement", placeholder: "JJ-MM-AAAA", type: "date" },
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
  schools: {
    title: "Gestion des établissements",
    addLabel: "Ajouter un établissement",
    fields: [
      { key: "name", label: "Nom", placeholder: "Nom de l'établissement" },
      { key: "code", label: "Code unique", placeholder: "Auto : CD-2026-0001" },
      { key: "type", label: "Type", placeholder: "Choisir le type", type: "select" },
      { key: "country", label: "Pays", placeholder: "RDC" },
      { key: "city", label: "Ville", placeholder: "Kinshasa" },
      { key: "address", label: "Adresse", placeholder: "Adresse complète" },
      { key: "phone", label: "Téléphone", placeholder: "+243 ..." },
      { key: "email", label: "Email", placeholder: "contact@ecole.cd" },
      { key: "website", label: "Site web", placeholder: "https://..." },
      { key: "slogan", label: "Slogan", placeholder: "Excellence et Innovation" },
      { key: "logoUrl", label: "Logo", placeholder: "URL JPG, PNG ou WebP" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "schoolYear", label: "Année scolaire", placeholder: "2025-2026" },
      { key: "currency", label: "Devise", placeholder: "Choisir la devise", type: "select" },
      { key: "timezone", label: "Fuseau horaire", placeholder: "Choisir le fuseau", type: "select" },
      { key: "language", label: "Langue", placeholder: "Choisir la langue", type: "select" },
      { key: "dateFormat", label: "Format date", placeholder: "Choisir le format", type: "select" },
      { key: "primaryColor", label: "Couleur principale", placeholder: "#2563EB" },
      { key: "subscriptionPlan", label: "Abonnement", placeholder: "Choisir le plan", type: "select" },
      { key: "subscriptionStartDate", label: "Début abonnement", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "subscriptionEndDate", label: "Fin abonnement", placeholder: "JJ-MM-AAAA", type: "date" },
      { key: "maxStudents", label: "Maximum élèves", placeholder: "1200", keyboardType: "numeric" },
      { key: "maxTeachers", label: "Maximum enseignants", placeholder: "120", keyboardType: "numeric" },
    ],
  },
  users: {
    title: "Gestion des utilisateurs",
    addLabel: "Créer un utilisateur",
    fields: [
      { key: "lastName", label: "Nom", placeholder: "Nom" },
      { key: "firstName", label: "Prénom", placeholder: "Prénom" },
      { key: "gender", label: "Sexe", placeholder: "Choisir le sexe", type: "select" },
      { key: "phone", label: "Téléphone", placeholder: "+243 ..." },
      { key: "email", label: "Email", placeholder: "email@exemple.com" },
      { key: "role", label: "Rôle", placeholder: "Choisir le rôle", type: "select" },
      { key: "schoolCode", label: "Établissement", placeholder: "Choisir l'établissement", type: "select" },
      { key: "accessChannel", label: "Canal d'accès", placeholder: "BackOffice ou Application", type: "select" },
      { key: "identifier", label: "Identifiant unique", placeholder: "USR001" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "photoUrl", label: "Photo", placeholder: "Ajouter une photo", type: "photo" },
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
      { key: "priority", label: "Priorité", placeholder: "Choisir une priorité", type: "select" },
      { key: "message", label: "Message", placeholder: "Message au parent" },
      { key: "attachmentUrl", label: "Pièce jointe", placeholder: "Lien PDF, image, audio ou vidéo" },
      { key: "status", label: "Statut", placeholder: "Choisir le statut", type: "select" },
      { key: "date", label: "Date", placeholder: "JJ-MM-AAAA", type: "date" },
    ],
  },
};

export default function AdminCrudScreen({ route }: Props) {
  const { entity } = route.params;
  const { session } = useAuth();
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
    countriesData,
    paymentStatusesData,
    schoolsData,
    usersData,
    paymentsData,
    subscriptionsData,
  } = useAdminData();
  const config = configs[entity];
  const items = getItems(entity);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [selectField, setSelectField] = useState<Field | null>(null);
  const [selectedCourseClass, setSelectedCourseClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolTypeFilter, setSchoolTypeFilter] = useState("Tous");
  const [schoolCountryFilter, setSchoolCountryFilter] = useState("Tous");
  const [userRoleFilter, setUserRoleFilter] = useState("Tous");
  const [userStatusFilter, setUserStatusFilter] = useState("Tous");
  const [dateField, setDateField] = useState<Field | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const canCreate = canMutateEntity(session, entity, "CREATE");
  const canRead = canReadEntity(session, entity);
  const canUpdate = canMutateEntity(session, entity, "UPDATE");
  const canDelete = canMutateEntity(session, entity, "DELETE");

  useEffect(() => {
    if (!canRead) {
      setVisible(false);
      setSelectField(null);
      setDateField(null);
    }
  }, [canRead]);

  useEffect(() => {
    if (entity === "courses" && !selectedCourseClass && classesData.length > 0) {
      setSelectedCourseClass(classesData[0].name);
    }
  }, [classesData, entity, selectedCourseClass]);

  const visibleItems = useMemo(() => {
    if (entity === "courses" && selectedCourseClass) {
      return items.filter((item: any) => normalize(item.className) === normalize(selectedCourseClass));
    }

    if (entity === "schools") {
      const query = normalize(searchQuery);
      const type = normalize(schoolTypeFilter);
      const country = normalize(schoolCountryFilter);

      return items.filter((item: any) => {
        const matchesSearch =
          !query ||
          [item.name, item.code, item.city, item.country].some((value) =>
            normalize(value).includes(query)
          );
        const matchesType = schoolTypeFilter === "Tous" || normalize(item.type) === type;
        const matchesCountry = schoolCountryFilter === "Tous" || normalize(item.country) === country;

        return matchesSearch && matchesType && matchesCountry;
      });
    }

    if (entity === "users") {
      const query = normalize(searchQuery);

      return items.filter((item: any) => {
        const adminCreated = isAdminCreatedUser(item);
        const matchesSearch =
          !query ||
          [item.lastName, item.firstName, item.phone, item.email, item.identifier].some((value) =>
            normalize(value).includes(query)
          );
        const matchesRole = userRoleFilter === "Tous" || normalize(item.role) === normalize(userRoleFilter);
        const matchesStatus = userStatusFilter === "Tous" || normalize(item.status) === normalize(userStatusFilter);

        return adminCreated && !isPlatformUserRole(item.role) && matchesSearch && matchesRole && matchesStatus;
      });
    }

    return items;
  }, [
    entity,
    items,
    schoolCountryFilter,
    schoolTypeFilter,
    searchQuery,
    selectedCourseClass,
    userRoleFilter,
    userStatusFilter,
  ]);

  const statsLabel = useMemo(() => `${visibleItems.length} élément(s)`, [visibleItems.length]);

  const openCreate = () => {
    if (!canCreate) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de créer cet élément.");
      return;
    }

    setEditingItem(null);
    const initialForm = getInitialForm(entity, {
      schoolsData,
      usersData,
      session,
    });
    setForm({
      ...initialForm,
      ...(entity === "courses" && selectedCourseClass
        ? { className: selectedCourseClass }
        : {}),
    });
    setVisible(true);
  };

  const openEdit = (item: any) => {
    if (!canUpdate) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de modifier cet élément.");
      return;
    }

    setEditingItem(item);
    setForm(itemToForm(entity, item));
    if (entity === "courses") {
      setSelectedCourseClass(item.className);
    }
    setVisible(true);
  };

  const save = () => {
    if (editingItem && !canUpdate) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de modifier cet élément.");
      return;
    }

    if (!editingItem && !canCreate) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de créer cet élément.");
      return;
    }

    const nextItem = formToItem(entity, form, editingItem?.id, {
      studentsData,
      teachersData,
      classesData,
      coursesData,
      paymentsData,
      schoolsData,
      usersData,
      countriesData,
      subscriptionsData,
      session,
    });

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
      schoolsData,
      studentsData,
      usersData,
      countriesData,
      subscriptionsData,
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
    if (!canDelete) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de supprimer cet élément.");
      return;
    }

    Alert.alert("Supprimer", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteItem(entity, item.id),
      },
    ]);
  };

  const resetUserPassword = async (item: any) => {
    if (!canUpdate) {
      Alert.alert("Accès refusé", "Votre rôle ne permet pas de modifier ce compte.");
      return;
    }

    const temporaryPassword = generateTemporaryPassword();
    let savedUser = item;

    try {
      const response = await resetUserPasswordOnBackend(item.id, temporaryPassword);
      savedUser = response.user ?? item;
    } catch {
      // En mode hors ligne/démo, on conserve la mise à jour locale.
    }

    const nextItem = {
      ...item,
      ...savedUser,
      temporaryPassword,
      password: temporaryPassword,
      pin: temporaryPassword,
      passwordHash: undefined,
      pinHash: undefined,
      history: [
        ...(item.history ?? []),
        `Mot de passe temporaire régénéré le ${formatDate(new Date())}. Ancien mot de passe invalidé.`,
      ],
    };

    updateItem("users", nextItem);
    Alert.alert(
      "Mot de passe réinitialisé",
      `Nouveau mot de passe temporaire : ${temporaryPassword}\nL'ancien mot de passe ne fonctionne plus.`
    );
  };

  const choosePhotoSource = (field: Field) => {
    Alert.alert("Photo du compte", "Choisissez la source de la photo.", [
      { text: "Annuler", style: "cancel" },
      { text: "Importer une photo", onPress: () => uploadPhoto(field.key) },
      { text: "Prendre une photo", onPress: () => takePhoto(field.key) },
    ]);
  };

  const uploadPhoto = async (fieldKey: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès aux photos pour importer une image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm((current) => ({ ...current, [fieldKey]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (fieldKey: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorisez l'accès à l'appareil photo pour prendre une photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm((current) => ({ ...current, [fieldKey]: result.assets[0].uri }));
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!canRead ? (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={24} color="#DC2626" />
            <Text style={styles.emptyText}>Accès refusé pour ce module.</Text>
          </View>
        ) : (
        <>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{statsLabel}</Text>
          </View>
          {canCreate && (
            <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>

        {entity === "schools" && (
          <View style={styles.filtersCard}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher nom, code, ville ou pays"
                style={styles.searchInput}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {["Tous", ...new Set(schoolsData.map((item) => item.type).filter(Boolean))].map((type) => (
                <TouchableOpacity
                  key={`type-${type}`}
                  activeOpacity={0.85}
                  style={[styles.filterPill, schoolTypeFilter === type && styles.filterPillActive]}
                  onPress={() => setSchoolTypeFilter(type)}
                >
                  <Text style={[styles.filterText, schoolTypeFilter === type && styles.filterTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {["Tous", ...new Set(schoolsData.map((item) => item.country).filter(Boolean))].map((country) => (
                <TouchableOpacity
                  key={`country-${country}`}
                  activeOpacity={0.85}
                  style={[styles.filterPill, schoolCountryFilter === country && styles.filterPillActive]}
                  onPress={() => setSchoolCountryFilter(country)}
                >
                  <Text style={[styles.filterText, schoolCountryFilter === country && styles.filterTextActive]}>
                    {country}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {entity === "users" && (
          <View style={styles.filtersCard}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher nom, téléphone, email ou identifiant"
                style={styles.searchInput}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {["Tous", ...Object.keys(rolePermissions).filter((role) => !isPlatformUserRole(role))].map((role) => (
                <TouchableOpacity
                  key={`role-${role}`}
                  activeOpacity={0.85}
                  style={[styles.filterPill, userRoleFilter === role && styles.filterPillActive]}
                  onPress={() => setUserRoleFilter(role)}
                >
                  <Text style={[styles.filterText, userRoleFilter === role && styles.filterTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {["Tous", "Actif", "Suspendu", "Désactivé"].map((status) => (
                <TouchableOpacity
                  key={`user-status-${status}`}
                  activeOpacity={0.85}
                  style={[styles.filterPill, userStatusFilter === status && styles.filterPillActive]}
                  onPress={() => setUserStatusFilter(status)}
                >
                  <Text style={[styles.filterText, userStatusFilter === status && styles.filterTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
            {canUpdate && (
              <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={20} color="#2563EB" />
              </TouchableOpacity>
            )}
            {entity === "users" && canUpdate && (
              <TouchableOpacity style={styles.iconButtonWarning} onPress={() => resetUserPassword(item)}>
                <Ionicons name="key-outline" size={20} color="#B45309" />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity style={styles.iconButtonDanger} onPress={() => confirmDelete(item)}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {visibleItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={22} color="#94A3B8" />
            <Text style={styles.emptyText}>Aucun élément pour cette sélection</Text>
          </View>
        )}
        </>
        )}
      </ScrollView>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingItem ? "Modifier" : config.addLabel}</Text>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              {config.fields.map((field) => (
                shouldHideField(entity, form, field) ? null : (
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
                  ) : field.type === "photo" ? (
                    <View style={styles.photoField}>
                      {form[field.key] ? (
                        <View style={styles.photoPreviewRow}>
                          <Image source={{ uri: form[field.key] }} style={styles.photoPreview} />
                          <View style={styles.photoMeta}>
                            <Text style={styles.photoTitle}>Photo sélectionnée</Text>
                            <Text style={styles.photoSubtitle} numberOfLines={1}>
                              {form[field.key]}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.photoRemoveButton}
                            activeOpacity={0.85}
                            onPress={() => setForm((current) => ({ ...current, [field.key]: "" }))}
                          >
                            <Ionicons name="close" size={18} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.photoHelp}>Aucune photo sélectionnée</Text>
                      )}

                      <TouchableOpacity
                        style={styles.photoButton}
                        activeOpacity={0.85}
                        onPress={() => choosePhotoSource(field)}
                      >
                        <Ionicons name="camera-outline" size={18} color="#2563EB" />
                        <Text style={styles.photoButtonText}>{field.placeholder}</Text>
                      </TouchableOpacity>
                    </View>
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
                )
              ))}
            </ScrollView>

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
                schoolsData,
                usersData,
                countriesData,
                form
              ).map((option, index) => (
                <TouchableOpacity
                  key={`${selectField?.key ?? "option"}-${option}-${index}`}
                  style={styles.selectorOption}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (selectField) {
                      setForm((current) => ({
                        ...current,
                        [selectField.key]: option,
        ...(entity === "users" && selectField.key === "role"
          ? getRoleDefaults(option, form.schoolCode || getDefaultSchoolCode(schoolsData, session))
          : {}),
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
  if (entity === "users") {
    return {
      ...Object.fromEntries(Object.entries(item).map(([key, value]) => [key, String(value ?? "")])),
      secondaryRoles: (item.secondaryRoles ?? []).join(", "),
    };
  }

  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, String(value)])
  );
}

function getInitialForm(entity: AdminEntity, context?: any): Record<string, string> {
  if (entity === "users") {
    const schoolCode = getDefaultSchoolCode(context?.schoolsData ?? [], context?.session);
    const role = "Secrétaire";
    return {
      gender: "Non renseigné",
      role,
      ...getRoleDefaults(role, schoolCode),
      schoolCode,
      accessChannel: "Application",
      identifier: generateUserIdentifier(context?.usersData ?? []),
      status: "Actif",
      temporaryPassword: generateTemporaryPassword(),
      createdBy: context?.session?.user?.name ?? "Administrateur",
    };
  }

  return {};
}

function formToItem(entity: AdminEntity, form: Record<string, string>, id?: string, context?: any) {
  const nextId = id ?? createInternalId(entity);
  const year = String(new Date().getFullYear());
  const schoolCode = context?.schoolsData?.[0]?.code ?? "CD-2026-0001";

  if (entity === "students") {
    if (!form.name || !form.className) return null;
    const publicId = form.matricule || generateLearnerPublicId(schoolCode, context?.studentsData ?? []);
    return {
      id: nextId,
      publicId,
      name: form.name,
      firstName: form.firstName ?? "",
      matricule: publicId,
      gender: form.gender || "Non renseigné",
      birthDate: form.birthDate || "",
      className: form.className,
      schoolCode,
      parentName: form.parentName ?? "",
      parentPhone: form.parentPhone ?? "",
      parentEmail: form.parentEmail ?? "",
      archived: false,
    };
  }

  if (entity === "teachers") {
    if (!form.name || !form.phone) return null;
    const publicId = form.publicId || generateTeacherPublicId(schoolCode, context?.teachersData ?? []);
    return {
      id: nextId,
      publicId,
      name: form.name,
      firstName: form.firstName ?? "",
      gender: form.gender || "Non renseigné",
      phone: form.phone,
      email: form.email ?? "",
      mainSubject: form.mainSubject ?? "",
      assignments: [],
    };
  }

  if (entity === "classes") {
    if (!form.name) return null;
    return {
      id: nextId,
      publicId: form.publicId || generatePublicId("CLS", year, context?.classesData ?? [], 6),
      name: form.name,
      level: form.level ?? "",
      track: form.track ?? "",
      teacherId: form.teacherId ?? "",
    };
  }

  if (entity === "countries") {
    if (!form.name || !form.code || !form.phonePrefix || !form.currency) return null;
    const code = form.code.trim().toUpperCase();

    return {
      id: id ?? `COUNTRY-${code}`,
      name: form.name,
      code,
      phonePrefix: form.phonePrefix,
      currency: form.currency.trim().toUpperCase(),
      timezone: form.timezone || "Africa/Kinshasa",
      status: form.status || "Actif",
      administratorId: form.administratorId ?? "",
      createdAt: form.createdAt || formatDate(new Date()),
    };
  }

  if (entity === "courses") {
    if (!form.className || !form.name) return null;
    return {
      id: nextId,
      publicId: form.publicId || generatePublicId("COU", year, context?.coursesData ?? [], 6),
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
      publicId: form.publicId || generatePublicId("PAY", year, context?.paymentsData ?? [], 6),
      studentId: form.studentId,
      amount: Number(form.amount) || 0,
      date: form.date || formatDate(new Date()),
      status: form.status || "PAYE",
      method: form.method || "Mobile Money",
    };
  }

  if (entity === "subscriptions") {
    if (!form.schoolCode || !form.plan) return null;
    const school = (context?.schoolsData ?? []).find((item: any) => item.code === form.schoolCode);
    const country = form.country || school?.country || "";
    const countryCode = form.countryCode || getCountryCode(country);
    const currency = form.currency || school?.currency || "USD";

    return {
      id: id ?? `SUB-${form.schoolCode}`,
      schoolCode: form.schoolCode,
      countryCode,
      country,
      plan: form.plan,
      monthlyPrice: Number(form.monthlyPrice) || 0,
      annualPrice: Number(form.annualPrice) || 0,
      currency,
      status: form.status || "Actif",
      paymentStatus: form.paymentStatus || "À jour",
      startDate: form.startDate || formatDate(new Date()),
      endDate: form.endDate || formatDate(addMonths(new Date(), 12)),
      lastPaymentDate: form.lastPaymentDate || "",
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

  if (entity === "schools") {
    if (
      !form.name ||
      !form.type ||
      !form.country ||
      !form.city ||
      !form.address ||
      !form.phone ||
      !form.email
    ) {
      return null;
    }
    const code = form.code?.trim().toUpperCase() || generateSchoolCode(form.country, year, context?.schoolsData ?? []);

    return {
      id: id ?? createInternalId("school"),
      publicId: code,
      code,
      name: form.name,
      type: form.type,
      city: form.city,
      country: form.country,
      address: form.address,
      phone: form.phone,
      email: form.email,
      website: form.website ?? "",
      currency: form.currency || "CDF",
      slogan: form.slogan ?? "",
      status: form.status || "Actif",
      logoUrl: form.logoUrl ?? "",
      schoolYear: form.schoolYear || "2025-2026",
      timezone: form.timezone || "Africa/Kinshasa",
      language: form.language || "Français",
      dateFormat: form.dateFormat || "JJ-MM-AAAA",
      primaryColor: form.primaryColor || "#2563EB",
      subscriptionPlan: form.subscriptionPlan || "Essentiel",
      subscriptionStartDate: form.subscriptionStartDate || formatDate(new Date()),
      subscriptionEndDate: form.subscriptionEndDate || formatDate(addMonths(new Date(), 12)),
      maxStudents: Number(form.maxStudents) || 500,
      maxTeachers: Number(form.maxTeachers) || 50,
      createdAt: form.createdAt || formatDate(new Date()),
    };
  }

  if (entity === "users") {
    const userSchoolCode = form.schoolCode || schoolCodeFromContext(context);
    const defaults = getRoleDefaults(form.role, userSchoolCode);
    const temporaryPassword = form.temporaryPassword || generateTemporaryPassword();
    if (
      !form.lastName ||
      !form.firstName ||
      !form.phone ||
      !form.role ||
      isPlatformUserRole(form.role) ||
      !userSchoolCode ||
      !form.identifier
    ) {
      return null;
    }

    const permissions = rolePermissions[form.role] ?? [];
    const publicId = form.publicId || generatePublicId("USR", year, context?.usersData ?? [], 6);

    return {
      id: id ?? `USER-${Date.now()}`,
      publicId,
      lastName: form.lastName,
      firstName: form.firstName,
      gender: form.gender,
      phone: form.phone,
      email: form.email ?? "",
      role: form.role,
      secondaryRoles: splitList(form.secondaryRoles),
      scopeLevel: form.scopeLevel || defaults.scopeLevel,
      countryScope: form.countryScope ?? "",
      schoolCode: userSchoolCode,
      accessChannel: form.accessChannel || defaults.accessChannel,
      identifier: form.identifier.trim(),
      status: form.status || "Actif",
      permissions,
      temporaryPassword,
      password: temporaryPassword,
      pin: temporaryPassword,
      photoUrl: form.photoUrl ?? "",
      createdAt: form.createdAt || formatDate(new Date()),
      lastLoginAt: form.lastLoginAt ?? "",
      createdBy: form.createdBy || context?.session?.user?.name || "Administrateur",
      history: [
        ...(splitList(form.history).length ? splitList(form.history) : []),
        `${id ? "Compte modifié" : `Compte créé avec mot de passe temporaire ${temporaryPassword}`} le ${formatDate(new Date())}`,
      ],
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
      attachmentUrl: form.attachmentUrl ?? "",
      priority: form.priority || "Moyenne",
      status: form.status || "Envoyé",
      date: form.date || formatDate(new Date()),
      sentAt: `${form.date || formatDate(new Date())} 00:00`,
      audit: [
        {
          action: id ? "Modification" : "Création",
          actorId: "ADMIN1",
          date: `${formatDate(new Date())} 00:00`,
        },
      ],
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
  if (entity === "countries") return `${item.name} • ${item.code}`;
  if (entity === "subscriptions") return `${item.schoolCode} • ${item.plan}`;
  if (entity === "payments") return `${item.amount?.toLocaleString?.() ?? item.amount} FC`;
  if (entity === "paymentStatuses") return item.label;
  if (entity === "schools") return `${item.name} • ${item.publicId ?? item.code}`;
  if (entity === "users") return `${item.firstName} ${item.lastName}`;
  if (entity === "announcements") return item.title;
  if (entity === "assignments") return `${item.className} - ${item.course}`;
  if (entity === "messages") return item.theme;
  return item.name;
}

function getSecondaryText(entity: AdminEntity, item: any) {
  if (entity === "students") return `${item.publicId ?? item.matricule} • ${item.gender ?? "Sexe non renseigné"} • ${item.className} • Parent : ${item.parentPhone}`;
  if (entity === "teachers") {
    return `ID : ${item.publicId ?? item.id} • ${item.mainSubject ?? "Matière non renseignée"} • ${item.phone}`;
  }
  if (entity === "classes") return `${item.publicId ?? item.id} • ${item.level ?? "Niveau non renseigné"} • ${item.track ?? "Filière non renseignée"} • Responsable : ${item.teacherId || "Non assigné"}`;
  if (entity === "countries") return `${item.phonePrefix} • ${item.currency} • ${item.timezone} • ${item.status}`;
  if (entity === "courses") return `${item.publicId ?? item.id} • ${item.className} • Coefficient : ${item.coefficient}`;
  if (entity === "assignments") return `Enseignant : ${item.teacherId}`;
  if (entity === "subscriptions") return `${item.country} • ${item.monthlyPrice} ${item.currency}/mois • ${item.paymentStatus} • fin ${item.endDate}`;
  if (entity === "paymentStatuses") return `Code : ${item.value}`;
  if (entity === "schools") {
    return `${item.type} • ${item.city}, ${item.country} • ${item.status} • ${item.maxStudents} élèves / ${item.maxTeachers} enseignants`;
  }
  if (entity === "users") {
    return `${item.role} • ${item.accessChannel} • ${item.status} • Identifiant : ${item.identifier}${item.temporaryPassword ? ` • Mot de passe temporaire : ${item.temporaryPassword}` : ""}`;
  }
  if (entity === "payments") return `${item.publicId ?? item.id} • Élève ${item.studentId} • ${item.date} • ${item.status} • ${item.method ?? "Mode non renseigné"}`;
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
  schoolsData: any[];
  studentsData: any[];
  usersData: any[];
  countriesData: any[];
  subscriptionsData: any[];
};

function validateBusinessRules({
  entity,
  item,
  editingId,
  teachersData,
  classesData,
  coursesData,
  assignmentsData,
  schoolsData,
  studentsData,
  usersData,
  countriesData,
  subscriptionsData,
}: BusinessValidationInput) {
  if (entity === "users") {
    const identifier = normalize(item.identifier);
    const phone = normalize(item.phone);
    const schoolExists = schoolsData.some((schoolItem) => normalize(schoolItem.code) === normalize(item.schoolCode));
    const duplicateIdentifier = usersData.find(
      (user) =>
        user.id !== editingId &&
        normalize(user.schoolCode) === normalize(item.schoolCode) &&
        normalize(user.identifier) === identifier
    );
    const duplicatePhone = usersData.find(
      (user) =>
        user.id !== editingId &&
        normalize(user.schoolCode) === normalize(item.schoolCode) &&
        normalize(user.phone) === phone
    );

    if (item.role === "Admin Pays" && !item.countryScope) {
      return "Utilisateur impossible : un Admin Pays doit être rattaché à un pays.";
    }

    if (!isGlobalOrCountryRole(item.role) && !schoolExists) {
      return "Utilisateur impossible : l'établissement sélectionné n'existe pas.";
    }

    if (duplicateIdentifier) {
      return "Utilisateur impossible : cet identifiant est déjà utilisé dans cet établissement.";
    }

    if (duplicatePhone) {
      return "Utilisateur impossible : ce téléphone est déjà utilisé par un autre compte.";
    }

    if (item.photoUrl && !isValidPhotoReference(item.photoUrl)) {
      return "Photo impossible : veuillez choisir une image ou utiliser une URL valide.";
    }

    return null;
  }

  if (entity === "countries") {
    const duplicateCountry = countriesData.find(
      (country) => country.id !== editingId && normalize(country.code) === normalize(item.code)
    );

    if (duplicateCountry) {
      return "Création impossible : ce code pays existe déjà.";
    }

    return null;
  }

  if (entity === "subscriptions") {
    const duplicateSubscription = subscriptionsData.find(
      (subscription) =>
        subscription.id !== editingId && normalize(subscription.schoolCode) === normalize(item.schoolCode)
    );

    if (duplicateSubscription) {
      return "Abonnement impossible : cet établissement possède déjà un abonnement.";
    }

    if (!schoolsData.some((schoolItem) => normalize(schoolItem.code) === normalize(item.schoolCode))) {
      return "Abonnement impossible : l'établissement sélectionné n'existe pas.";
    }

    const endDate = parseDisplayDate(item.endDate);

    if (endDate && endDate.getTime() < Date.now() && item.status === "Actif") {
      return "Abonnement impossible : un abonnement actif doit avoir une date de fin future.";
    }

    return null;
  }

  if (entity === "schools") {
    const code = normalize(item.code);
    const duplicateCode = schoolsData.find(
      (schoolItem) => schoolItem.id !== editingId && normalize(schoolItem.code) === code
    );

    if (duplicateCode) {
      return "Création impossible : ce code établissement existe déjà.";
    }

    if (item.logoUrl && !/\.(jpg|jpeg|png|webp)$/i.test(item.logoUrl)) {
      return "Logo impossible : le fichier doit être au format JPG, PNG ou WebP.";
    }

    if (Number(item.maxStudents) < studentsData.length) {
      return `Abonnement impossible : la limite élèves (${item.maxStudents}) est inférieure à l'effectif actuel (${studentsData.length}).`;
    }

    if (Number(item.maxTeachers) < teachersData.length) {
      return `Abonnement impossible : la limite enseignants (${item.maxTeachers}) est inférieure à l'effectif actuel (${teachersData.length}).`;
    }

    const endDate = parseDisplayDate(item.subscriptionEndDate);

    if (endDate && endDate.getTime() < Date.now()) {
      return "Abonnement expiré : la date de fin doit être future pour un établissement actif.";
    }

    return null;
  }

  if (entity === "classes") {
    const teacherId = normalize(item.teacherId);

    if (!teacherId) {
      return null;
    }

    const teacherExists = teachersData.some(
      (teacher) => normalize(teacher.id) === teacherId || normalize(teacher.publicId) === teacherId
    );

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
  const teacherExists = teachersData.some(
    (teacher) => normalize(teacher.id) === teacherId || normalize(teacher.publicId) === teacherId
  );
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

function isValidPhotoReference(value: string) {
  return /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i.test(value);
}

function splitList(value?: string) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createInternalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generatePublicId(prefix: string, year: string, items: any[], size = 6) {
  const next = getNextSequence(items, new RegExp(`^${prefix}-${year}-(\\d+)$`, "i"));
  return `${prefix}-${year}-${String(next).padStart(size, "0")}`;
}

function generateTeacherPublicId(schoolCode: string, teachersData: any[]) {
  const next = getNextSequence(
    teachersData,
    new RegExp(`^(?:${escapeRegExp(schoolCode)}-)?ENS-(\\d+)$`, "i")
  );
  return `ENS-${String(next).padStart(4, "0")}`;
}

function generateLearnerPublicId(
  schoolCode: string,
  studentsData: any[],
  profile: "ELE" | "ETU" = "ELE"
) {
  const next = getNextSequence(
    studentsData,
    new RegExp(`^(?:${escapeRegExp(schoolCode)}-)?${profile}-(\\d+)$`, "i")
  );
  return `${profile}-${String(next).padStart(4, "0")}`;
}

function generateSchoolCode(country: string, year: string, schoolsData: any[]) {
  const countryCode = getCountryCode(country);
  const next = getNextSequence(
    schoolsData,
    new RegExp(`^${countryCode}-${year}-(\\d+)$`, "i"),
    "code"
  );
  return `${countryCode}-${year}-${String(next).padStart(4, "0")}`;
}

function getNextSequence(items: any[], pattern: RegExp, field = "publicId") {
  const highest = items.reduce((max, item) => {
    const value = String(item[field] ?? item.matricule ?? item.id ?? "");
    const match = value.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return highest + 1;
}

function getCountryCode(country: string) {
  const value = normalize(country);
  const codes: Record<string, string> = {
    france: "FR",
    fr: "FR",
    rdc: "CD",
    "république démocratique du congo": "CD",
    "republique democratique du congo": "CD",
    congo: "CG",
    cg: "CG",
    cameroun: "CM",
    cm: "CM",
    sénégal: "SN",
    senegal: "SN",
    sn: "SN",
  };

  return codes[value] ?? (value.slice(0, 2).toUpperCase() || "CD");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isGlobalOrCountryRole(role?: string) {
  return role === "Super Administrateur SchoolLink" || role === "Admin Pays";
}

function shouldHideField(entity: AdminEntity, form: Record<string, string>, field: Field) {
  return entity === "users" && form.role === "Admin Pays" && field.key === "schoolCode";
}

function isAdminCreatedUser(item: any) {
  const creator = normalize(item.createdBy);
  return Boolean(creator) && !["systeme", "système", "postgresql", "seed", "migration"].includes(creator);
}

function isPlatformUserRole(role?: string) {
  return role === "Super Administrateur SchoolLink" || role === "Admin Pays";
}

function getRoleDefaults(role?: string, schoolCode = "") {
  if (role === "Super Administrateur SchoolLink") {
    return { scopeLevel: "Global", schoolCode: "*", accessChannel: "Application" };
  }

  if (role === "Admin Pays") {
    return { scopeLevel: "Pays", schoolCode: "*", accessChannel: "Application" };
  }

  return { scopeLevel: "Établissement", schoolCode, accessChannel: "Application" };
}

function generateTemporaryPassword() {
  return `SL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function generateUserIdentifier(usersData: any[]) {
  const nextNumber = usersData.length + 1;
  return `USR-${String(nextNumber).padStart(4, "0")}`;
}

function getDefaultSchoolCode(schoolsData: any[], session?: any) {
  const sessionSchool = session?.user?.schoolCode && session.user.schoolCode !== "*"
    ? session.user.schoolCode
    : session?.school?.code;
  return sessionSchool || schoolsData[0]?.code || "CD-2026-0001";
}

function schoolCodeFromContext(context?: any) {
  return context?.session
    ? getDefaultSchoolCode(context?.schoolsData ?? [], context.session)
    : context?.schoolsData?.[0]?.code ?? "CD-2026-0001";
}

function getSelectOptions(
  key: string | undefined,
  entity: AdminEntity,
  studentsData: any[],
  teachersData: any[],
  classesData: any[],
  coursesData: any[],
  paymentStatusesData: any[],
  schoolsData: any[],
  usersData: any[],
  countriesData: any[],
  form: Record<string, string>
) {
  if (key === "gender") {
    return ["Masculin", "Féminin"];
  }

  if (key === "teacherId") {
    return teachersData.map((teacher) => teacher.publicId ?? teacher.id).filter(Boolean);
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

  if (key === "priority") {
    return ["Faible", "Moyenne", "Haute", "Critique"];
  }

  if (key === "method") {
    return ["Mobile Money", "Carte bancaire", "Espèces", "Virement bancaire"];
  }

  if (key === "type") {
    return ["École primaire", "Collège", "Lycée", "Université", "Institut"];
  }

  if (key === "role") {
    return Object.keys(rolePermissions).filter((role) => !isPlatformUserRole(role));
  }

  if (key === "schoolCode") {
    return entity === "subscriptions"
      ? schoolsData.map((schoolItem) => schoolItem.code).filter(Boolean)
      : schoolsData.map((schoolItem) => schoolItem.code).filter(Boolean);
  }

  if (key === "administratorId") {
    return usersData
      .filter((user) => user.role === "Admin Pays")
      .map((user) => user.publicId ?? user.identifier ?? user.id)
      .filter(Boolean);
  }

  if (key === "scopeLevel") {
    return ["Établissement"];
  }

  if (key === "accessChannel") {
    return ["BackOffice", "Application"];
  }

  if (key === "currency") {
    return ["CDF", "XOF", "XAF", "EUR", "USD"];
  }

  if (key === "timezone") {
    return ["Africa/Kinshasa", "Africa/Abidjan", "Africa/Dakar", "Africa/Douala", "Europe/Paris"];
  }

  if (key === "language") {
    return ["Français", "Anglais"];
  }

  if (key === "dateFormat") {
    return ["JJ-MM-AAAA", "AAAA-MM-JJ"];
  }

  if (key === "subscriptionPlan" || key === "plan") {
    return ["Essentiel", "Standard", "Premium"];
  }

  if (key === "paymentStatus") {
    return ["À jour", "En retard", "En attente"];
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
    if (entity === "users") {
      return ["Actif", "Suspendu", "Désactivé"];
    }

    if (entity === "schools") {
      return ["Actif", "Suspendu"];
    }

    if (entity === "countries") {
      return ["Actif", "Suspendu"];
    }

    if (entity === "subscriptions") {
      return ["Actif", "Suspendu", "Expiré"];
    }

    if (entity === "messages") {
      return ["Envoyé", "Distribué", "Lu", "Archivé", "Nouveau", "En cours", "Traité"];
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
  filtersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#0F172A",
    fontWeight: "800",
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  filterPillActive: {
    backgroundColor: "#0F172A",
  },
  filterText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  filterTextActive: {
    color: "#FFFFFF",
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
  iconButtonWarning: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
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
    maxHeight: "88%",
  },
  modalTitle: { color: "#0F172A", fontSize: 22, fontWeight: "900", marginBottom: 16 },
  formScroll: {
    maxHeight: 480,
  },
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
  photoField: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
  },
  photoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  photoPreview: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  photoMeta: {
    flex: 1,
    marginLeft: 12,
  },
  photoTitle: {
    color: "#0F172A",
    fontWeight: "900",
  },
  photoSubtitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  photoHelp: {
    color: "#94A3B8",
    fontWeight: "800",
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  photoButtonText: {
    color: "#2563EB",
    fontWeight: "900",
    marginLeft: 8,
  },
  photoRemoveButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
