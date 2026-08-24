import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function FuneralRequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Funeral Requests
      </Text>

      <Text style={styles.subtitle}>
        Review and manage funeral requests.
      </Text>

      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#D4AF37"
        />

        <Text style={styles.loadingText}>
          Loading funeral requests...
        </Text>
      </View>
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
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
});