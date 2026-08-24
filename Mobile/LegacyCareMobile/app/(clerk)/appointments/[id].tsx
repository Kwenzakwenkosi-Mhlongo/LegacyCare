import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Appointment
      </Text>

      <Text style={styles.label}>
        Appointment ID
      </Text>

      <Text style={styles.value}>
        {id}
      </Text>

      <Text style={styles.message}>
        Appointment details will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
    paddingTop: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
    marginBottom: 25,
  },

  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },

  message: {
    marginTop: 30,
    fontSize: 14,
    color: "#666",
  },
});