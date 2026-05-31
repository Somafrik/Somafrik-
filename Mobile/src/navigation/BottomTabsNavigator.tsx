import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ClassesScreen from "../screens/ClassesScreen";
import StudentsScreen from "../screens/StudentsScreen";
import TeachersScreen from "../screens/TeachersScreen";
import PaymentsScreen from "../screens/PaymentsScreen";
import MenuScreen from "../screens/MenuScreen";

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
};

export default function BottomTabsNavigator() {
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
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
      <Tab.Screen name="Enseignants" component={TeachersScreen} />
      <Tab.Screen name="Paiements" component={PaymentsScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}
