import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Colors from "../../theme/colors";

import {
    getPendingFuneralRequests,
} from "../../services/funeralRequest";

export default function FuneralRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD FUNERAL REQUESTS
  // ============================================================

  const loadRequests = async () => {
    try {
      setError("");

      const data = await getPendingFuneralRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log(
        "[CLERK] Failed to load funeral requests:",
        err
      );

      setError(
        err?.message ||
          "Unable to load funeral requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // REFRESH WHEN SCREEN IS FOCUSED
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  // ============================================================
  // PULL TO REFRESH
  // ============================================================

  const refresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // ============================================================
  // OPEN FUNERAL REQUEST
  // ============================================================

  const openRequest = (funeralRequestId: string) => {
   router.push({
  pathname: "/(clerk)/funerals-requests/[id]",
  params: {
    id: String(funeralRequestId),
  },
});
  };

  // ============================================================
  // RENDER REQUEST
  // ============================================================

  const renderRequest = ({
    item,
  }: {
    item: any;
  }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          openRequest(item.funeralRequestId)
        }
      >
        {/* ICON */}
        <View style={styles.icon}>
          <Ionicons
            name="flower-outline"
            size={25}
            color={Colors.gold}
          />
        </View>

        {/* DETAILS */}
        <View style={styles.details}>
          <Text style={styles.title}>
            Funeral Request
          </Text>

          <Text style={styles.id}>
            ID: {item.funeralRequestId}
          </Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={Colors.gold}
            />

            <Text style={styles.date}>
              {item.funeralDate
                ? new Date(
                    item.funeralDate
                  ).toLocaleDateString()
                : "Date unavailable"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={15}
              color={Colors.textMuted}
            />

            <Text style={styles.time}>
              {item.funeralTime ||
                "Time unavailable"}
            </Text>
          </View>

          {/* STATUS */}
          <View style={styles.status}>
            <Text style={styles.statusText}>
              {item.status || "Pending"}
            </Text>
          </View>
        </View>

        {/* ARROW */}
        <Ionicons
          name="chevron-forward"
          size={22}
          color={Colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.gold}
          />

          <Text style={styles.loadingText}>
            Loading funeral requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Funeral Requests
          </Text>

          <Text style={styles.headerSubtitle}>
            Pending requests requiring review
          </Text>
        </View>

        <View style={styles.count}>
          <Text style={styles.countText}>
            {requests.length}
          </Text>
        </View>
      </View>

      {/* ERROR */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={22}
            color="#DC2626"
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            onPress={loadRequests}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* EMPTY */}
      {requests.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="checkmark-circle-outline"
              size={55}
              color={Colors.gold}
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Pending Funeral Requests
          </Text>

          <Text style={styles.emptyText}>
            There are currently no funeral requests
            waiting for review.
          </Text>
        </View>
      ) : (
        /* REQUEST LIST */
        <FlatList
          data={requests}
          keyExtractor={(item) =>
            String(item.funeralRequestId)
          }
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.gold}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ------------------------------------------------------------
  // HEADER
  // ------------------------------------------------------------

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textMuted,
  },

  count: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: Colors.gold,
    fontWeight: "700",
    fontSize: 16,
  },

  // ------------------------------------------------------------
  // LIST
  // ------------------------------------------------------------

  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // ------------------------------------------------------------
  // CARD
  // ------------------------------------------------------------

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  details: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  id: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.textMuted,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  date: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  time: {
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // ------------------------------------------------------------
  // STATUS
  // ------------------------------------------------------------

  status: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },

  statusText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: Colors.textMuted,
  },

  // ------------------------------------------------------------
  // EMPTY
  // ------------------------------------------------------------

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
  },

  // ------------------------------------------------------------
  // ERROR
  // ------------------------------------------------------------

  errorBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    flexDirection: "row",
    alignItems: "center",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    color: "#991B1B",
    fontSize: 13,
  },

  retryButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#DC2626",
  },

  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
});