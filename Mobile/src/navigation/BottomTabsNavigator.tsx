import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ClassesScreen from "../screens/ClassesScreen";
import StudentsScreen from "../screens/StudentsScreen";
import TeachersScreen from "../screens/TeachersScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import MenuScreen from "../screens/MenuScreen";
import MessagesScreen from "../screens/MessagesScreen";
import StudentDetailScreen from "../screens/StudentDetailScreen";
import StudentNotesScreen from "../screens/StudentNotesScreen";
import StudentPresencesScreen from "../screens/StudentPresencesScreen";
import StudentPaymentsScreen from "../screens/StudentPaymentsScreen";
import TeacherAttendanceScreen from "../screens/TeacherAttendanceScreen";
import TeacherGradesScreen from "../screens/TeacherGradesScreen";
import { useAuth } from "../context/AuthContext";
import { canReadRoute } from "../domain/security/permissions";

const Tab = createBottomTabNavigator();

const tabConfig: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    focusedIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  Accueil: {
    label: "Accueil",
    icon: "home-outline",
    focusedIcon: "home",
  },
  Classes: {
    label: "Classes",
    icon: "grid-outline",
    focusedIcon: "grid",
  },
  Enseignants: {
    label: "Profs",
    icon: "school-outline",
    focusedIcon: "school",
  },
  Paiements: {
    label: "Frais",
    icon: "card-outline",
    focusedIcon: "card",
  },
  Menu: {
    label: "Menu",
    icon: "menu-outline",
    focusedIcon: "menu",
  },
  Profil: {
    label: "Profil",
    icon: "person-outline",
    focusedIcon: "person",
  },
  Notes: {
    label: "Notes",
    icon: "book-outline",
    focusedIcon: "book",
  },
  Presences: {
    label: "Présence",
    icon: "calendar-outline",
    focusedIcon: "calendar",
  },
  FraisEleve: {
    label: "Frais",
    icon: "wallet-outline",
    focusedIcon: "wallet",
  },
  Messages: {
    label: "Messages",
    icon: "chatbubbles-outline",
    focusedIcon: "chatbubbles",
  },
  TeacherStudents: {
    label: "Élèves",
    icon: "people-outline",
    focusedIcon: "people",
  },
  TeacherAttendance: {
    label: "Appel",
    icon: "checkbox-outline",
    focusedIcon: "checkbox",
  },
  TeacherGrades: {
    label: "Notes",
    icon: "reader-outline",
    focusedIcon: "reader",
  },
};

export default function BottomTabsNavigator() {
  const { session } = useAuth();
  const isParentStudent = session?.role === "parent_student" || session?.role === "student";
  const isTeacher = session?.role === "teacher";
  const isGlobalAdmin = session?.role === "super_admin" || session?.role === "country_admin";
  const isPedagogicalStaff = session?.role === "principal" || session?.role === "prefet";
  const isSecretary = session?.role === "secretary";
  const canOpenClasses = canReadRoute(session, "Classes");
  const canOpenStudents = canReadRoute(session, "Students");
  const canOpenTeachers = canReadRoute(session, "Teachers");
  const canOpenPayments = canReadRoute(session, "Payments");
  const canOpenProfile = canReadRoute(session, "Profil");
  const canOpenNotes = canReadRoute(session, "Notes");
  const canOpenPresences = canReadRoute(session, "Presences");
  const canOpenStudentPayments = canReadRoute(session, "FraisEleve");
  const canOpenMessages = canReadRoute(session, "Messages");
  const canOpenTeacherAttendance = canReadRoute(session, "TeacherAttendance");
  const canOpenTeacherGrades = canReadRoute(session, "TeacherGrades");

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabel: tabConfig[route.name]?.label ?? route.name,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },

        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          height: 76,
          backgroundColor: "#0F172A",
          borderRadius: 24,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 8,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 5,
          },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          overflow: "hidden",
        },
        tabBarItemStyle: {
          height: 58,
          borderRadius: 18,
          marginHorizontal: 2,
          paddingVertical: 5,
        },

        tabBarIcon: ({ focused }) => {
          const config = tabConfig[route.name] ?? tabConfig.Menu;
          const iconName = focused ? config.focusedIcon : config.icon;

          return (
            <Ionicons
              name={iconName}
              size={24}
              color={focused ? "#FFFFFF" : "#94A3B8"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      {isParentStudent ? (
        <>
          {canOpenProfile && <Tab.Screen name="Profil" component={StudentDetailScreen} />}
          {canOpenNotes && <Tab.Screen name="Notes" component={StudentNotesScreen} />}
          {canOpenPresences && <Tab.Screen name="Presences" component={StudentPresencesScreen} />}
          {canOpenStudentPayments && <Tab.Screen name="FraisEleve" component={StudentPaymentsScreen} />}
        </>
      ) : isTeacher ? (
        <>
          {canOpenClasses && <Tab.Screen name="Classes" component={ClassesScreen} />}
          {canOpenStudents && <Tab.Screen name="TeacherStudents" component={StudentsScreen} />}
          {canOpenTeacherAttendance && <Tab.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />}
          {canOpenTeacherGrades && <Tab.Screen name="TeacherGrades" component={TeacherGradesScreen} />}
        </>
      ) : isPedagogicalStaff ? (
        <>
          {canOpenClasses && <Tab.Screen name="Classes" component={ClassesScreen} />}
          {canOpenStudents && <Tab.Screen name="TeacherStudents" component={StudentsScreen} />}
          {canOpenTeacherAttendance && <Tab.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />}
          {canOpenTeacherGrades && <Tab.Screen name="TeacherGrades" component={TeacherGradesScreen} />}
        </>
      ) : isSecretary ? (
        <>
          {canOpenStudents && <Tab.Screen name="TeacherStudents" component={StudentsScreen} />}
          {canOpenTeacherAttendance && <Tab.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />}
          {canOpenPayments && <Tab.Screen name="Paiements" component={PaymentsScreen} />}
          {canOpenMessages && <Tab.Screen name="Messages" component={MessagesScreen} />}
        </>
      ) : isGlobalAdmin ? (
        <>
          {canOpenClasses && <Tab.Screen name="Classes" component={ClassesScreen} />}
          {canOpenTeachers && <Tab.Screen name="Enseignants" component={TeachersScreen} />}
          {canOpenPayments && <Tab.Screen name="Paiements" component={PaymentsScreen} />}
          {canOpenStudents && (
            <Tab.Screen
              name="Students"
              component={StudentsScreen}
              options={{
                tabBarButton: () => null,
                tabBarItemStyle: { display: "none" },
              }}
            />
          )}
        </>
      ) : (
        <>
          {canOpenClasses && <Tab.Screen name="Classes" component={ClassesScreen} />}
          {canOpenStudents && (
            <Tab.Screen
              name="Students"
              component={StudentsScreen}
              options={{
                tabBarButton: () => null,
                tabBarItemStyle: { display: "none" },
              }}
            />
          )}
          {canOpenTeachers && <Tab.Screen name="Enseignants" component={TeachersScreen} />}
          {canOpenPayments && <Tab.Screen name="Paiements" component={PaymentsScreen} />}
        </>
      )}
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}
