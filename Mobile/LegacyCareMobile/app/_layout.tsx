import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

import { AuthProvider } from "../src/context/AuthContext";
import { getUser } from "../src/services/auth";

export default function Layout() {
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getUser();

      if (!user) {
        return;
      }

      // ============================================================
      // CLIENT
      // ============================================================

      if (
        user.role &&
        user.role.toLowerCase() === "client"
      ) {
        router.replace("/(client)");
        return;
      }

      // ============================================================
      // STAFF / CLERK
      // ============================================================

      if (
        user.role &&
        user.role.toLowerCase() === "staff"
      ) {
        const staffRole =
          user.staffRole ||
          user.StaffRole ||
          "";

        // CLERK
        if (
          staffRole.toString().toLowerCase() === "clerk"
        ) {
          router.replace("/(clerk)");
          return;
        }

        // OPERATIONAL STAFF
        router.replace("/(staff)");
        return;
      }

      // ============================================================
      // UNKNOWN ROLE
      // ============================================================

      console.log(
        "[AUTH] Unknown user role:",
        user.role
      );
    } catch (error) {
      console.log(
        "[AUTH] Failed to check logged-in user:",
        error
      );
    }
  };

  return (
    <AuthProvider>
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0F172A"
        />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </>
    </AuthProvider>
  );
}