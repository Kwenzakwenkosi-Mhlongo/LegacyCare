// app/(clerk)/funerals-requests/index.tsx

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

import { getPendingFuneralRequests } from "../../services/funeralRequest";
import Colors from "../../theme/colors";

// ============================================================
// TYPES
// ============================================================

type FuneralRequest = {
  funeralRequestId: string;
  deathNotificationId?: string | null;

  clientId?: string | null;

  branchId?: string | null;
  branchName?: string | null;

  funeralType?: string | null;

  funeralDate?: string | null;
  funeralTime?: string | null;

  venue?: string | null;

  notes?: string | null;

  status?: string | null;

  staffRequired?: number | null;
  staffAssigned?: number | null;
  staffRemaining?: number | null;

  staffingStatus?: string | null;

  createdDate?: string | null;
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(value?: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) {
    return "Time unavailable";
  }

  return value.length >= 5
    ? value.slice(0, 5)
    : value;
}

function getStaffingStatus(
  assigned: number,
  required: number
) {
  if (assigned >= required) {
    return "Fully Staffed";
  }

  if (assigned > 0) {
    return "Partially Staffed";
  }

  return "Awaiting Staff Assignment";
}

function getStaffProgress(
  assigned: number,
  required: number
) {
  if (required <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (assigned / required) * 100
    )
  );
}

// ============================================================
// SCREEN
// ============================================================

export default function FuneralRequestsScreen() {
  const [requests, setRequests] =
    useState<FuneralRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  const loadRequests =
    useCallback(async () => {
      try {
        setError("");

        const data =
          await getPendingFuneralRequests();

        setRequests(
          Array.isArray(data)
            ? data
            : []
        );
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
    }, []);

  // ============================================================
  // REFRESH ON FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests])
  );

  // ============================================================
  // PULL TO REFRESH
  // ============================================================

  const refresh = () => {
    setRefreshing(true);

    void loadRequests();
  };

  // ============================================================
  // OPEN REQUEST
  // ============================================================

  const openRequest = (
    funeralRequestId: string
  ) => {
    router.push({
      pathname:
        "/(clerk)/funerals-requests/[id]",

      params: {
        id: String(
          funeralRequestId
        ),
      },
    });
  };

  // ============================================================
  // RENDER CARD
  // ============================================================

  const renderRequest = ({
    item,
  }: {
    item: FuneralRequest;
  }) => {
    const staffRequired =
      item.staffRequired &&
      item.staffRequired > 0
        ? item.staffRequired
        : 4;

    const staffAssigned =
      item.staffAssigned ?? 0;

    const staffingStatus =
      item.staffingStatus ||
      getStaffingStatus(
        staffAssigned,
        staffRequired
      );

    const progress =
      getStaffProgress(
        staffAssigned,
        staffRequired
      );

    const fullyStaffed =
      staffAssigned >=
      staffRequired;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          openRequest(
            item.funeralRequestId
          )
        }
      >
        {/* HEADER */}

        <View style={styles.cardHeader}>
          <View style={styles.icon}>
            <Ionicons
              name="flower-outline"
              size={24}
              color={Colors.gold}
            />
          </View>

          <View style={styles.headerContent}>
            <Text style={styles.title}>
              {item.funeralType ||
                "Funeral"}{" "}
              Funeral
            </Text>

            <Text style={styles.id}>
              ID:{" "}
              {item.funeralRequestId}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color={Colors.textMuted}
          />
        </View>

        {/* DIVIDER */}

        <View style={styles.divider} />

        {/* FUNERAL DETAILS */}

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons
              name="calendar-outline"
              size={17}
              color={Colors.gold}
            />

            <View style={styles.detailText}>
              <Text style={styles.label}>
                Funeral Date
              </Text>

              <Text style={styles.value}>
                {formatDate(
                  item.funeralDate
                )}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={17}
              color={Colors.gold}
            />

            <View style={styles.detailText}>
              <Text style={styles.label}>
                Funeral Time
              </Text>

              <Text style={styles.value}>
                {formatTime(
                  item.funeralTime
                )}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="location-outline"
              size={17}
              color={Colors.gold}
            />

            <View style={styles.detailText}>
              <Text style={styles.label}>
                Venue
              </Text>

              <Text
                style={styles.value}
                numberOfLines={2}
              >
                {item.venue ||
                  "Not specified"}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="business-outline"
              size={17}
              color={Colors.gold}
            />

            <View style={styles.detailText}>
              <Text style={styles.label}>
                Branch
              </Text>

              <Text
                style={styles.value}
                numberOfLines={2}
              >
                {item.branchName ||
                  item.branchId ||
                  "Not specified"}
              </Text>
            </View>
          </View>
        </View>

        {/* STAFFING */}

        <View style={styles.staffSection}>
          <View style={styles.staffHeader}>
            <View>
              <Text style={styles.staffTitle}>
                Staff Assignment
              </Text>

              <Text style={styles.staffSubtitle}>
                {staffingStatus}
              </Text>
            </View>

            <View
              style={[
                styles.staffCountBadge,
                fullyStaffed &&
                  styles.staffCountBadgeComplete,
              ]}
            >
              <Text
                style={[
                  styles.staffCountText,
                  fullyStaffed &&
                    styles.staffCountTextComplete,
                ]}
              >
                {staffAssigned}/
                {staffRequired}
              </Text>
            </View>
          </View>

          <View
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width:
                    `${progress}%`,
                },
                fullyStaffed &&
                  styles.progressBarComplete,
              ]}
            />
          </View>

          <View style={styles.staffFooter}>
            <Text
              style={styles.staffHint}
            >
              {fullyStaffed
                ? "Ready for approval"
                : `${Math.max(
                    0,
                    staffRequired -
                      staffAssigned
                  )} staff member(s) still required`}
            </Text>

            {!fullyStaffed && (
              <View
                style={
                  styles.actionHint
                }
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={Colors.gold}
                />

                <Text
                  style={
                    styles.actionHintText
                  }
                >
                  Assign staff
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* STATUS */}

        <View style={styles.footer}>
          <View style={styles.status}>
            <Text
              style={styles.statusText}
            >
              {item.status ||
                "Pending"}
            </Text>
          </View>

          <Text style={styles.openText}>
            Review request
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.gold}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading funeral
            requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={styles.headerTitle}
          >
            Funeral Requests
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Review pending funerals
            and assign branch staff.
          </Text>
        </View>

        <View style={styles.count}>
          <Text
            style={styles.countText}
          >
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

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={() =>
              void loadRequests()
            }
            style={
              styles.retryButton
            }
          >
            <Text
              style={styles.retryText}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* EMPTY */}

      {!error &&
      requests.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={styles.emptyIcon}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={55}
              color={Colors.gold}
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No Pending Funeral
            Requests
          </Text>

          <Text
            style={styles.emptyText}
          >
            There are currently no
            funeral requests waiting
            for review.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) =>
            String(
              item.funeralRequestId
            )
          }
          renderItem={renderRequest}
          contentContainerStyle={
            styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={refresh}
              tintColor={
                Colors.gold
              }
            />
          }
          showsVerticalScrollIndicator={
            false
          }
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
    backgroundColor:
      Colors.background,
  },

  // ------------------------------------------------------------
  // HEADER
  // ------------------------------------------------------------

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  headerLeft: {
    flex: 1,
    paddingRight: 15,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color:
      Colors.textPrimary,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color:
      Colors.textMuted,
  },

  count: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor:
      Colors.primary,
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
    paddingBottom: 40,
  },

  // ------------------------------------------------------------
  // CARD
  // ------------------------------------------------------------

  card: {
    backgroundColor:
      Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color:
      Colors.textPrimary,
  },

  id: {
    marginTop: 3,
    fontSize: 11,
    color:
      Colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor:
      Colors.border,
    marginVertical: 15,
  },

  // ------------------------------------------------------------
  // DETAILS
  // ------------------------------------------------------------

  detailsGrid: {
    gap: 12,
  },

  detailItem: {
    flexDirection: "row",
    alignItems:
      "flex-start",
  },

  detailText: {
    flex: 1,
    marginLeft: 9,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color:
      Colors.textMuted,
    textTransform:
      "uppercase",
  },

  value: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color:
      Colors.textPrimary,
  },

  // ------------------------------------------------------------
  // STAFF
  // ------------------------------------------------------------

  staffSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor:
      Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  staffHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  staffTitle: {
    fontSize: 14,
    fontWeight: "700",
    color:
      Colors.textPrimary,
  },

  staffSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color:
      Colors.textMuted,
  },

  staffCountBadge: {
    minWidth: 48,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor:
      "#FEF3C7",
    alignItems: "center",
  },

  staffCountBadgeComplete: {
    backgroundColor:
      "#DCFCE7",
  },

  staffCountText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "700",
  },

  staffCountTextComplete: {
    color: "#166534",
  },

  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor:
      "#E5E7EB",
    marginTop: 13,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 4,
    backgroundColor:
      Colors.gold,
  },

  progressBarComplete: {
    backgroundColor:
      "#16A34A",
  },

  staffFooter: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  staffHint: {
    flex: 1,
    fontSize: 11,
    color:
      Colors.textMuted,
  },

  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },

  actionHintText: {
    marginLeft: 4,
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },

  // ------------------------------------------------------------
  // FOOTER
  // ------------------------------------------------------------

  footer: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor:
      Colors.primary,
  },

  statusText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
  },

  openText: {
    color: Colors.gold,
    fontSize: 12,
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
    color:
      Colors.textMuted,
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
    backgroundColor:
      Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    color:
      Colors.textPrimary,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color:
      Colors.textMuted,
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
    backgroundColor:
      "#FEE2E2",
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
    backgroundColor:
      "#DC2626",
  },

  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
});