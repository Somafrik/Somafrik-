import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import LoginScreen from "../screens/LoginScreen";
import BottomTabsNavigator from "./BottomTabsNavigator";

import StudentsScreen from "../screens/StudentsScreen";
import SchoolManagementScreen from "../screens/SchoolManagementScreen";
import ClassesScreen from "../screens/ClassesScreen";
import StudentDetailScreen from "../screens/StudentDetailScreen";
import StudentNotesScreen from "../screens/StudentNotesScreen";
import StudentPresencesScreen from "../screens/StudentPresencesScreen";
import StudentPaymentsScreen from "../screens/StudentPaymentsScreen";
import TeachersScreen from "../screens/TeachersScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import AnnouncementsScreen from "../screens/AnnouncementsScreen";
import AdminCrudScreen from "../screens/AdminCrudScreen";
import MessagesScreen from "../screens/MessagesScreen";
import TimetableScreen from "../screens/TimetableScreen";
import ReportCardsScreen from "../screens/ReportCardsScreen";
import { AdminEntity } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";

export type UserRole = "school_admin" | "teacher" | "parent_student" | "student";

export type RootStackParamList = {
  RoleSelection: undefined;
  Login: {
    school: {
      id: string;
      publicId?: string;
      code: string;
      name: string;
      city: string;
      slogan: string;
      logoUrl?: string;
    };
  };
  Home: {
    role: UserRole;
  };
  Students: {
    className?: string;
  };
  StudentDetail: {
    studentId: string;
  };
  StudentNotes: {
    studentId: string;
  };
  StudentPresences: {
    studentId: string;
  };
  StudentPayments: {
    studentId: string;
  };
  SchoolManagement: undefined;
  Classes: undefined;
  Teachers: undefined;
  Payments: undefined;
  Announcements: undefined;
  Messages: undefined;
  Timetable: undefined;
  ReportCards: undefined;
  AdminCrud: {
    entity: AdminEntity;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeTabs() {
  return <BottomTabsNavigator/>;
}

export default function AppNavigator() {
  const { session } = useAuth();
  const role = session?.role;
  const isAdmin = role === "school_admin";
  const isTeacher = role === "teacher";
  const isParent = role === "parent_student";
  const isStudent = role === "student";
  const canOpenStudentScreens = isAdmin || isTeacher || isParent || isStudent;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelection">
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ title: "SchoolLink" }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />

        {isAdmin && (
          <>
            <Stack.Screen name="SchoolManagement" component={SchoolManagementScreen} />
            <Stack.Screen name="Teachers" component={TeachersScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="AdminCrud" component={AdminCrudScreen} options={{ title: "Administration" }} />
          </>
        )}

        {(isAdmin || isTeacher) && (
          <>
            <Stack.Screen name="Classes" component={ClassesScreen} />
            <Stack.Screen name="Students" component={StudentsScreen} options={{ title: "Élèves" }} />
          </>
        )}

        {canOpenStudentScreens && (
          <>
            <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
            <Stack.Screen name="StudentNotes" component={StudentNotesScreen} options={{ title: "Notes" }} />
            <Stack.Screen name="StudentPresences" component={StudentPresencesScreen} options={{ title: "Présences" }} />
          </>
        )}

        {(isAdmin || isParent || isStudent) && (
          <Stack.Screen name="StudentPayments" component={StudentPaymentsScreen} options={{ title: "Paiements" }} />
        )}

        {(isAdmin || isTeacher || isParent || isStudent) && (
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
        )}

        {(isAdmin || isTeacher || isParent) && (
          <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Messages" }} />
        )}

        {(isAdmin || isTeacher || isParent || isStudent) && (
          <>
            <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: "Emploi du temps" }} />
            <Stack.Screen name="ReportCards" component={ReportCardsScreen} options={{ title: "Bulletins" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
