import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ClassesScreen from "../screens/ClassesScreen";
import StudentsScreen from "../screens/StudentsScreen";
import TeachersScreen from "../screens/TeachersScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import MenuScreen from "../screens/MenuScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,

       tabBarStyle: {
  position: "absolute",
  left: 16,
  right: 16,
  bottom: 15,

  height: 72,

  backgroundColor: "#0F172A",

  borderRadius: 25,

  borderTopWidth: 0,

  elevation: 12,

  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 10,
},

        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Accueil") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Classes") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "Enseignants") {
            iconName = focused ? "school" : "school-outline";
          } else if (route.name === "Paiements") {
            iconName = focused ? "card" : "card-outline";
          } else {
            iconName = focused ? "menu" : "menu-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={28}
              color={focused ? "#3B82F6" : "#9CA3AF"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen
  name="Students"
  component={StudentsScreen}
  options={{
    tabBarButton: () => null,
  }}
/>
      <Tab.Screen name="Enseignants" component={TeachersScreen} />
      <Tab.Screen name="Paiements" component={PaymentsScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}