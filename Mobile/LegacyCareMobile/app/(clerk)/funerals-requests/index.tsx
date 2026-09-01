// app/(clerk)/funerals-requests/index.tsx

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
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

import {
  FuneralRequestDetails,
  getPendingFuneralRequests,
} from "../../../services/funeralRequest";

const STAFF_REQUIRED = 4;

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(
  value?: string | null
): string {
  if (!value) {
    return "Not specified";
  }

  if (value.length >= 5) {
    return value.slice(0, 5);
  }

  return value;
}

function getStaffAssigned(
  request: FuneralRequestDetails
): number {
  return (
    request.staffAssigned ??
    request.staffDeployed?.length ??
    0
  );
}

function getStaffRequired(
  request: FuneralRequestDetails
): number {
  return (
    request.staffRequired ??
    STAFF_REQUIRED
  );
}

export default function FuneralRequestsScreen() {
  const [
    requests,
    setRequests,
  ] = useState<
    FuneralRequestDetails[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadRequests =
    useCallback(
      async (
        isRefresh = false
      ): Promise<void> => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const data =
            await getPendingFuneralRequests();

          setRequests(
            Array.isArray(data)
              ? data
              : []
          );
        } catch (err) {
          console.log(
            "[FUNERAL REQUESTS] ERROR:",
            err
          );

          const message =
            err instanceof Error
              ? err.message
              : "Unable to load funeral requests.";

          setError(message);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests])
  );

  const handleOpenRequest = (
    funeralRequestId: string
  ): void => {
    router.push({
      pathname:
        "/(clerk)/funerals-requests/[id]",
      params: {
        id: funeralRequestId,
      },
    });
  };

  const renderRequest = ({
    item,
  }: {
    item: FuneralRequestDetails;
  }) => {
    const staffAssigned =
      getStaffAssigned(item);

    const staffRequired =
      getStaffRequired(item);

    const fullyStaffed =
      staffAssigned >=
      staffRequired;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          handleOpenRequest(
            item.funeralRequestId
          )
        }
      >
        <View
          style={
            styles.cardHeader
          }
        >
          <View
            style={
              styles.cardTitleContainer
            }
          >
            <Text
              style={
                styles.funeralType
              }
            >
              {item.funeralType ||
                "Standard Funeral"}
            </Text>

            <Text
              style={
                styles.requestId
              }
              numberOfLines={1}
            >
              {
                item.funeralRequestId
              }
            </Text>
          </View>

          <View
            style={
              styles.statusBadge
            }
          >
            <Text
              style={
                styles.statusText
              }
            >
              {item.status ||
                "Pending"}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <InfoRow
          icon="calendar-outline"
          label="Date"
          value={formatDate(
            item.funeralDate
          )}
        />

        <InfoRow
          icon="time-outline"
          label="Time"
          value={formatTime(
            item.funeralTime
          )}
        />

        <InfoRow
          icon="location-outline"
          label="Venue"
          value={
            item.venue ||
            "Not specified"
          }
        />

        <InfoRow
          icon="business-outline"
          label="Branch"
          value={
            item.branchName ||
            item.branchId ||
            "Not specified"
          }
        />

        <View
          style={
            styles.staffSection
          }
        >
          <View
            style={
              styles.staffHeader
            }
          >
            <View
              style={
                styles.staffTitleRow
              }
            >
              <Ionicons
                name="people-outline"
                size={18}
                color="#D4AF37"
              />

              <Text
                style={
                  styles.staffLabel
                }
              >
                Staff Assignment
              </Text>
            </View>

            <Text
              style={[
                styles.staffCount,
                fullyStaffed &&
                  styles.staffCountComplete,
              ]}
            >
              {staffAssigned}/
              {staffRequired}
            </Text>
          </View>

          <View
            style={
              styles.progressTrack
            }
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    (
                      staffAssigned /
                      Math.max(
                        staffRequired,
                        1
                      )
                    ) *
                      100
                  )}%`,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.staffingStatus,
              fullyStaffed &&
                styles.staffingStatusComplete,
            ]}
          >
            {item.staffingStatus ||
              (fullyStaffed
                ? "Fully Staffed - Ready for Approval"
                : `${Math.max(
                    staffRequired -
                      staffAssigned,
                    0
                  )} staff member(s) still required`)}
          </Text>
        </View>

        <View
          style={
            styles.openRow
          }
        >
          <Text
            style={
              styles.openText
            }
          >
            Review Funeral
          </Text>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#D4AF37"
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="large"
            color="#D4AF37"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading funeral requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error &&
    requests.length === 0
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Funeral Requests
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Review pending funeral arrangements and assign staff.
          </Text>
        </View>

        <View
          style={
            styles.center
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={54}
            color="#DC2626"
          />

          <Text
            style={
              styles.errorTitle
            }
          >
            Unable to load requests
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={() =>
              void loadRequests()
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View>
          <Text
            style={
              styles.title
            }
          >
            Funeral Requests
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Review pending funeral arrangements and assign exactly 4 staff.
          </Text>
        </View>

        <View
          style={
            styles.countBadge
          }
        >
          <Text
            style={
              styles.countNumber
            }
          >
            {requests.length}
          </Text>

          <Text
            style={
              styles.countLabel
            }
          >
            Pending
          </Text>
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(
          item
        ) =>
          item.funeralRequestId
        }
        renderItem={
          renderRequest
        }
        contentContainerStyle={
          requests.length === 0
            ? styles.emptyList
            : styles.list
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadRequests(
                true
              )
            }
            tintColor="#D4AF37"
          />
        }
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="flower-outline"
                size={42}
                color="#D4AF37"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No Pending Funerals
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              There are currently no funeral requests waiting for clerk review.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <View
        style={
          styles.infoIcon
        }
      >
        <Ionicons
          name={icon}
          size={17}
          color="#D4AF37"
        />
      </View>

      <View
        style={
          styles.infoContent
        }
      >
        <Text
          style={
            styles.infoLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.infoValue
          }
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F5F5F5",
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
    },

    title: {
      fontSize: 26,
      fontWeight: "700",
      color: "#222222",
    },

    subtitle: {
      marginTop: 6,
      maxWidth: 260,
      fontSize: 13,
      lineHeight: 19,
      color: "#666666",
    },

    countBadge: {
      minWidth: 60,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor:
        "#1F2937",
      alignItems:
        "center",
    },

    countNumber: {
      color: "#D4AF37",
      fontSize: 18,
      fontWeight: "700",
    },

    countLabel: {
      marginTop: 1,
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
    },

    list: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
      paddingHorizontal: 20,
    },

    card: {
      marginBottom: 16,
      padding: 17,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      backgroundColor:
        "#FFFFFF",
    },

    cardHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    cardTitleContainer: {
      flex: 1,
      paddingRight: 12,
    },

    funeralType: {
      fontSize: 17,
      fontWeight: "700",
      color: "#222222",
    },

    requestId: {
      marginTop: 4,
      fontSize: 10,
      color: "#888888",
    },

    statusBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor:
        "#FEF3C7",
    },

    statusText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#92400E",
    },

    divider: {
      height: 1,
      marginVertical: 14,
      backgroundColor:
        "#EEEEEE",
    },

    infoRow: {
      flexDirection: "row",
      alignItems:
        "center",
      marginBottom: 11,
    },

    infoIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#1F2937",
    },

    infoContent: {
      flex: 1,
      marginLeft: 10,
    },

    infoLabel: {
      fontSize: 10,
      fontWeight: "600",
      textTransform:
        "uppercase",
      color: "#888888",
    },

    infoValue: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: "600",
      color: "#333333",
    },

    staffSection: {
      marginTop: 7,
      padding: 12,
      borderRadius: 12,
      backgroundColor:
        "#F9FAFB",
    },

    staffHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    staffTitleRow: {
      flexDirection: "row",
      alignItems:
        "center",
    },

    staffLabel: {
      marginLeft: 7,
      fontSize: 12,
      fontWeight: "700",
      color: "#333333",
    },

    staffCount: {
      fontSize: 13,
      fontWeight: "700",
      color: "#B45309",
    },

    staffCountComplete: {
      color: "#15803D",
    },

    progressTrack: {
      height: 7,
      marginTop: 11,
      overflow: "hidden",
      borderRadius: 5,
      backgroundColor:
        "#E5E7EB",
    },

    progressFill: {
      height: "100%",
      borderRadius: 5,
      backgroundColor:
        "#D4AF37",
    },

    staffingStatus: {
      marginTop: 7,
      fontSize: 11,
      color: "#B45309",
    },

    staffingStatusComplete: {
      color: "#15803D",
      fontWeight: "600",
    },

    openRow: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      alignItems:
        "center",
      marginTop: 15,
    },

    openText: {
      marginRight: 4,
      fontSize: 12,
      fontWeight: "700",
      color: "#D4AF37",
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#666666",
    },

    errorTitle: {
      marginTop: 14,
      fontSize: 18,
      fontWeight: "700",
      color: "#222222",
    },

    errorText: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 19,
      color: "#666666",
    },

    retryButton: {
      marginTop: 20,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor:
        "#1F2937",
    },

    retryButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },

    emptyContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 30,
      paddingBottom: 70,
    },

    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#1F2937",
    },

    emptyTitle: {
      marginTop: 18,
      fontSize: 19,
      fontWeight: "700",
      color: "#222222",
    },

    emptyText: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 19,
      color: "#666666",
    },
  });