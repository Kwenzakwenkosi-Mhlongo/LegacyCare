// app/_layout.tsx

import {
  Stack,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import {
  useEffect,
  useRef,
} from "react";
import { StatusBar } from "react-native";

import {
  getStoredUser,
} from "../services/auth";
import { AuthProvider } from "../src/context/AuthContext";

function normalizeRole(
  role?: string | null
): string {
  return (
    role || ""
  )
    .trim()
    .toLowerCase();
}

function RootNavigator() {
  const router =
    useRouter();

  const rootNavigationState =
    useRootNavigationState();

  const hasCheckedAuth =
    useRef(false);

  useEffect(() => {
    if (
      !rootNavigationState?.key ||
      hasCheckedAuth.current
    ) {
      return;
    }

    hasCheckedAuth.current =
      true;

    const checkUser =
      async (): Promise<void> => {
        try {
          const user =
            await getStoredUser();

          if (!user) {
            console.log(
              "[AUTH] No stored user."
            );

            return;
          }

          const role =
            normalizeRole(
              user.role
            );

          console.log(
            "[AUTH] Stored role:",
            role
          );

          switch (role) {
            case "client":
              router.replace(
                "/(client)"
              );
              return;

            case "clerk":
              router.replace(
                "/(clerk)"
              );
              return;

            case "staff":
              router.replace(
                "/(staff)"
              );
              return;

            default:
              console.log(
                "[AUTH] Unknown stored user role:",
                user.role
              );
          }
        } catch (error) {
          console.log(
            "[AUTH] Failed to restore user session:",
            error
          );
        }
      };

    void checkUser();
  }, [
    rootNavigationState?.key,
    router,
  ]);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />

      <Stack
        screenOptions={{
          headerShown: false,
          animation:
            "slide_from_right",
        }}
      >
        <Stack.Screen
          name="index"
        />

        <Stack.Screen
          name="welcome"
        />

        <Stack.Screen
          name="login"
        />

        <Stack.Screen
          name="forgot_password"
        />

        <Stack.Screen
          name="(client)"
        />

        <Stack.Screen
          name="(clerk)"
        />

        <Stack.Screen
          name="(staff)"
        />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}