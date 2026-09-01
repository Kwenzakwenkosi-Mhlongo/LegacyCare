// app/(clerk)/funerals-requests/_layout.tsx

import { Stack } from "expo-router";

export default function FuneralRequestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}