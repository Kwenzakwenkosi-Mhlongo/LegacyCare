// ============================================================
// FILE: app/(clerk)/_layout.tsx
// ============================================================

import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Alert } from "react-native";

import { useAuth } from "../../src/context/AuthContext";
import Colors from "../../src/theme/colors";

export default function ClerkLayout() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = (): void => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();

            router.replace(
              "/login"
            );
          },
        },
      ]
    );
  };

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor:
          Colors.gold,
        tabBarInactiveTintColor:
          "#9CA3AF",
        tabBarStyle: {
          backgroundColor:
            Colors.primary,
          borderTopColor:
            Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="logout"
        options={{
          title: "Logout",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="log-out-outline"
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: (
            event
          ) => {
            event.preventDefault();

            handleLogout();
          },
        }}
      />

      <Tabs.Screen
        name="funerals-requests"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
