// File: app/(clerk)/appointments/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiRequest } from "../../../services/api";
import Colors from "../../../src/theme/colors";

type AppointmentFilter =
  | "All Open"
  | "Requested"
  | "Confirmed"
  | "Rescheduled"
  | "Completed"
  | "Cancelled"
  | "NoShow"
  | "All";

type Appointment = {
  appointmentId: number;
  serviceRequestId: number;

  clientId: string;
  branchId: string;

  appointmentType: string;

  preferredDateTime: string;
  confirmedDateTime?: string | null;

  status: string;
  priority: string;

  clientNotes?: string | null;
  clerkNotes?: string | null;

  assignedStaffId?: string | null;

  rescheduleReason?: string | null;
  cancellationReason?: string | null;

  createdDate: string;
  updatedDate: string;

  confirmedDate?: string | null;
  completedDate?: string | null;
  cancelledDate?: string | null;

  branch?: {
    branchId?: string | null;
    branchName?: string | null;
  } | null;

  assignedStaff?: {
    staffId?: string | null;
    staffRole?: string | null;

    user?: {
      fullName?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

const FILTERS: AppointmentFilter[] = [
  "All Open",
  "Requested",
  "Confirmed",
  "Rescheduled",
  "Completed",
  "Cancelled",
  "NoShow",
  "All",
];

function normalize(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function isOpenAppointment(
  status?: string | null
): boolean {
  const normalizedStatus =
    normalize(status);

  return (
    normalizedStatus === "requested" ||
    normalizedStatus === "confirmed" ||
    normalizedStatus === "rescheduled"
  );
}

function formatStatus(
  value?: string | null
): string {
  const status =
    normalize(value);

  if (
    status === "noshow" ||
    status === "no show"
  ) {
    return "No Show";
  }

  return value || "Unknown";
}

function formatFilterName(
  filter: AppointmentFilter
): string {
  if (filter === "NoShow") {
    return "No Show";
  }

  return filter;
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getStatusColors(
  status: string
): {
  backgroundColor: string;
  color: string;
} {
  switch (normalize(status)) {
    case "requested":
      return {
        backgroundColor:
          "#FEF3C7",
        color:
          "#92400E",
      };

    case "confirmed":
      return {
        backgroundColor:
          "#DCFCE7",
        color:
          "#166534",
      };

    case "rescheduled":
      return {
        backgroundColor:
          "#F3E8FF",
        color:
          "#7E22CE",
      };

    case "completed":
      return {
        backgroundColor:
          "#DBEAFE",
        color:
          "#1D4ED8",
      };

    case "cancelled":
      return {
        backgroundColor:
          "#E5E7EB",
        color:
          "#4B5563",
      };

    case "noshow":
    case "no show":
      return {
        backgroundColor:
          "#FFEDD5",
        color:
          "#C2410C",
      };

    default:
      return {
        backgroundColor:
          "#F3F4F6",
        color:
          "#4B5563",
      };
  }
}

export default function AppointmentsScreen() {
  const router =
    useRouter();

  const insets =
    useSafeAreaInsets();

  const [
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>([]);

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<AppointmentFilter>(
      "All Open"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const loadAppointments =
    useCallback(
      async (): Promise<void> => {
        try {
          setError("");

          const data =
            await apiRequest<
              Appointment[]
            >(
              "/Appointment/clerk"
            );

          const loadedAppointments =
            Array.isArray(data)
              ? data
              : [];

          setAppointments(
            loadedAppointments
          );

          console.log(
            "[CLERK APPOINTMENTS] COUNT:",
            loadedAppointments.length
          );
        } catch (err) {
          console.log(
            "[CLERK APPOINTMENTS] ERROR:",
            err
          );

          setAppointments([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load appointments."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      void loadAppointments();

      return undefined;
    }, [
      loadAppointments,
    ])
  );

  const handleRefresh =
    async (): Promise<void> => {
      setRefreshing(true);

      await loadAppointments();
    };

  const appointmentCounts =
    useMemo(
      () => {
        const requested =
          appointments.filter(
            (appointment) =>
              normalize(
                appointment.status
              ) === "requested"
          ).length;

        const confirmed =
          appointments.filter(
            (appointment) =>
              normalize(
                appointment.status
              ) === "confirmed"
          ).length;

        const rescheduled =
          appointments.filter(
            (appointment) =>
              normalize(
                appointment.status
              ) === "rescheduled"
          ).length;

        const completed =
          appointments.filter(
            (appointment) =>
              normalize(
                appointment.status
              ) === "completed"
          ).length;

        const cancelled =
          appointments.filter(
            (appointment) =>
              normalize(
                appointment.status
              ) === "cancelled"
          ).length;

        const noShow =
          appointments.filter(
            (appointment) => {
              const status =
                normalize(
                  appointment.status
                );

              return (
                status === "noshow" ||
                status === "no show"
              );
            }
          ).length;

        return {
          total:
            appointments.length,

          open:
            requested +
            confirmed +
            rescheduled,

          requested,
          confirmed,
          rescheduled,
          completed,
          cancelled,
          noShow,
        };
      },
      [
        appointments,
      ]
    );

  const filteredAppointments =
    useMemo(
      () => {
        const sorted =
          [...appointments].sort(
            (
              left,
              right
            ) =>
              new Date(
                right.createdDate
              ).getTime() -
              new Date(
                left.createdDate
              ).getTime()
          );

        if (
          selectedFilter ===
          "All"
        ) {
          return sorted;
        }

        if (
          selectedFilter ===
          "All Open"
        ) {
          return sorted.filter(
            (appointment) =>
              isOpenAppointment(
                appointment.status
              )
          );
        }

        if (
          selectedFilter ===
          "NoShow"
        ) {
          return sorted.filter(
            (appointment) => {
              const status =
                normalize(
                  appointment.status
                );

              return (
                status === "noshow" ||
                status === "no show"
              );
            }
          );
        }

        const normalizedFilter =
          normalize(
            selectedFilter
          );

        return sorted.filter(
          (appointment) =>
            normalize(
              appointment.status
            ) ===
            normalizedFilter
        );
      },
      [
        appointments,
        selectedFilter,
      ]
    );

  return (
    <LinearGradient
      colors={[
        Colors.primary,
        Colors.secondary,
      ]}
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          Colors.primary
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              Math.max(
                insets.top,
                16
              ),

            paddingBottom:
              30 +
              insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor={
              Colors.gold
            }
          />
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={
                22
              }
              color={
                Colors.white
              }
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Appointments
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              View and manage client appointments
            </Text>
          </View>

          <Text
            style={
              styles.brandText
            }
          >
            LegacyCare
          </Text>
        </View>

        <View
          style={
            styles.primarySummaryCard
          }
        >
          <View>
            <Text
              style={
                styles.primarySummaryLabel
              }
            >
              Open Appointments
            </Text>

            <Text
              style={
                styles.primarySummaryValue
              }
            >
              {
                appointmentCounts.open
              }
            </Text>
          </View>

          <View
            style={
              styles.primarySummaryIcon
            }
          >
            <Ionicons
              name="calendar-outline"
              size={
                28
              }
              color={
                Colors.gold
              }
            />
          </View>
        </View>

        <View
          style={
            styles.summaryGrid
          }
        >
          <SummaryCard
            value={
              appointmentCounts.requested
            }
            label="Requested"
          />

          <SummaryCard
            value={
              appointmentCounts.confirmed
            }
            label="Confirmed"
          />

          <SummaryCard
            value={
              appointmentCounts.rescheduled
            }
            label="Rescheduled"
          />

          <SummaryCard
            value={
              appointmentCounts.completed
            }
            label="Completed"
          />

          <SummaryCard
            value={
              appointmentCounts.cancelled
            }
            label="Cancelled"
          />

          <SummaryCard
            value={
              appointmentCounts.noShow
            }
            label="No Show"
          />
        </View>

        <View
          style={
            styles.filterSection
          }
        >
          <Text
            style={
              styles.filterTitle
            }
          >
            Filter Appointments
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterRow
            }
          >
            {FILTERS.map(
              (filter) => {
                const selected =
                  selectedFilter ===
                  filter;

                return (
                  <TouchableOpacity
                    key={
                      filter
                    }
                    style={[
                      styles.filterButton,

                      selected &&
                        styles.filterButtonActive,
                    ]}
                    activeOpacity={
                      0.8
                    }
                    onPress={() =>
                      setSelectedFilter(
                        filter
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,

                        selected &&
                          styles.filterTextActive,
                      ]}
                    >
                      {formatFilterName(
                        filter
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        <View
          style={
            styles.listHeader
          }
        >
          <View>
            <Text
              style={
                styles.listTitle
              }
            >
              {formatFilterName(
                selectedFilter
              )}
            </Text>

            <Text
              style={
                styles.listSubtitle
              }
            >
              {filteredAppointments.length}{" "}
              {filteredAppointments.length === 1
                ? "appointment"
                : "appointments"}
            </Text>
          </View>

          {selectedFilter ===
          "All Open" ? (
            <View
              style={
                styles.openBadge
              }
            >
              <View
                style={
                  styles.openDot
                }
              />

              <Text
                style={
                  styles.openBadgeText
                }
              >
                Active
              </Text>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color={
                Colors.gold
              }
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading appointments...
            </Text>
          </View>
        ) : null}

        {!loading &&
        error ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Ionicons
              name="alert-circle-outline"
              size={
                30
              }
              color="#FCA5A5"
            />

            <Text
              style={
                styles.errorTitle
              }
            >
              Unable to load appointments
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {
                error
              }
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={() => {
                setLoading(true);

                void loadAppointments();
              }}
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading &&
        !error &&
        filteredAppointments.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Ionicons
              name="calendar-outline"
              size={
                48
              }
              color={
                Colors.textMuted
              }
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No appointments
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {selectedFilter ===
              "All Open"
                ? "There are no open appointments for your branch."
                : `There are no ${formatFilterName(
                    selectedFilter
                  ).toLowerCase()} appointments.`}
            </Text>
          </View>
        ) : null}

        {!loading &&
          !error &&
          filteredAppointments.map(
            (appointment) => {
              const statusColors =
                getStatusColors(
                  appointment.status
                );

              const displayDate =
                appointment.confirmedDateTime ||
                appointment.preferredDateTime;

              return (
                <TouchableOpacity
                  key={
                    appointment.appointmentId
                  }
                  style={
                    styles.appointmentCard
                  }
                  activeOpacity={
                    0.8
                  }
                  onPress={() =>
                    router.push(
                      `/(clerk)/appointments/${appointment.appointmentId}` as never
                    )
                  }
                >
                  <View
                    style={
                      styles.cardTop
                    }
                  >
                    <View
                      style={
                        styles.iconBox
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={
                          24
                        }
                        color={
                          Colors.gold
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.cardTitleArea
                      }
                    >
                      <Text
                        style={
                          styles.requestNumber
                        }
                      >
                        REQ-
                        {String(
                          appointment.serviceRequestId
                        ).padStart(
                          5,
                          "0"
                        )}
                      </Text>

                      <Text
                        style={
                          styles.appointmentType
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          appointment.appointmentType
                        }
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            statusColors.backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              statusColors.color,
                          },
                        ]}
                      >
                        {formatStatus(
                          appointment.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Ionicons
                      name="location-outline"
                      size={
                        17
                      }
                      color={
                        Colors.textMuted
                      }
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      {appointment.branch
                        ?.branchName ||
                        appointment.branchId ||
                        "Branch not available"}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.infoRow
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={
                        17
                      }
                      color={
                        Colors.textMuted
                      }
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      {formatDateTime(
                        displayDate
                      )}
                    </Text>
                  </View>

                  {appointment.assignedStaffId ? (
                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <Ionicons
                        name="person-outline"
                        size={
                          17
                        }
                        color={
                          Colors.textMuted
                        }
                      />

                      <Text
                        style={
                          styles.infoText
                        }
                      >
                        {appointment
                          .assignedStaff
                          ?.user
                          ?.fullName ||
                          appointment.assignedStaffId}
                      </Text>
                    </View>
                  ) : null}

                  <View
                    style={
                      styles.cardFooter
                    }
                  >
                    <View
                      style={[
                        styles.priorityBadge,

                        normalize(
                          appointment.priority
                        ) === "high" &&
                          styles.priorityBadgeHigh,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,

                          normalize(
                            appointment.priority
                          ) === "high" &&
                            styles.priorityTextHigh,
                        ]}
                      >
                        {
                          appointment.priority
                        }{" "}
                        Priority
                      </Text>
                    </View>

                    <View
                      style={
                        styles.viewRow
                      }
                    >
                      <Text
                        style={
                          styles.viewText
                        }
                      >
                        Manage
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={
                          18
                        }
                        color={
                          Colors.gold
                        }
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          )}
      </ScrollView>
    </LinearGradient>
  );
}

function SummaryCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View
      style={
        styles.summaryCard
      }
    >
      <Text
        style={
          styles.summaryValue
        }
      >
        {
          value
        }
      </Text>

      <Text
        style={
          styles.summaryLabel
        }
      >
        {
          label
        }
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal:
        18,
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom:
        22,
    },

    backButton: {
      width:
        42,
      height:
        42,
      borderRadius:
        21,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight:
        12,
      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize:
        27,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    subtitle: {
      marginTop:
        3,
      fontSize:
        12,
      color:
        Colors.textMuted,
    },

    brandText: {
      fontSize:
        14,
      fontWeight:
        "700",
      color:
        Colors.gold,
    },

    primarySummaryCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      padding:
        18,
      marginBottom:
        12,
      borderRadius:
        18,
      borderWidth:
        1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    primarySummaryLabel: {
      fontSize:
        12,
      color:
        Colors.textMuted,
    },

    primarySummaryValue: {
      marginTop:
        3,
      fontSize:
        32,
      lineHeight:
        37,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    primarySummaryIcon: {
      width:
        52,
      height:
        52,
      borderRadius:
        16,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.primary,
    },

    summaryGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
      rowGap:
        9,
      marginBottom:
        20,
    },

    summaryCard: {
      width:
        "31.8%",
      minHeight:
        76,
      justifyContent:
        "center",
      padding:
        12,
      borderRadius:
        14,
      borderWidth:
        1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    summaryValue: {
      fontSize:
        21,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    summaryLabel: {
      marginTop:
        3,
      fontSize:
        9,
      color:
        Colors.textMuted,
    },

    filterSection: {
      marginBottom:
        5,
    },

    filterTitle: {
      marginBottom:
        9,
      fontSize:
        13,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    filterRow: {
      gap:
        8,
      paddingBottom:
        15,
    },

    filterButton: {
      paddingHorizontal:
        14,
      paddingVertical:
        9,
      borderRadius:
        18,
      borderWidth:
        1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    filterButtonActive: {
      borderColor:
        Colors.gold,
      backgroundColor:
        Colors.gold,
    },

    filterText: {
      fontSize:
        11,
      fontWeight:
        "600",
      color:
        Colors.textSecondary,
    },

    filterTextActive: {
      color:
        Colors.primary,
    },

    listHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom:
        12,
    },

    listTitle: {
      fontSize:
        18,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    listSubtitle: {
      marginTop:
        2,
      fontSize:
        10,
      color:
        Colors.textMuted,
    },

    openBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal:
        10,
      paddingVertical:
        6,
      borderRadius:
        12,
      backgroundColor:
        "rgba(212,175,55,0.12)",
    },

    openDot: {
      width:
        7,
      height:
        7,
      borderRadius:
        4,
      marginRight:
        6,
      backgroundColor:
        Colors.gold,
    },

    openBadgeText: {
      fontSize:
        10,
      fontWeight:
        "700",
      color:
        Colors.gold,
    },

    loadingContainer: {
      paddingVertical:
        70,
      alignItems:
        "center",
    },

    loadingText: {
      marginTop:
        12,
      fontSize:
        13,
      color:
        Colors.textMuted,
    },

    errorCard: {
      alignItems:
        "center",
      borderRadius:
        16,
      padding:
        24,
      backgroundColor:
        "rgba(220,38,38,0.12)",
      borderWidth:
        1,
      borderColor:
        "rgba(248,113,113,0.25)",
    },

    errorTitle: {
      marginTop:
        10,
      fontSize:
        15,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    errorText: {
      marginTop:
        6,
      fontSize:
        11,
      lineHeight:
        17,
      textAlign:
        "center",
      color:
        "#FCA5A5",
    },

    retryButton: {
      marginTop:
        15,
      paddingHorizontal:
        18,
      paddingVertical:
        10,
      borderRadius:
        10,
      backgroundColor:
        Colors.gold,
    },

    retryText: {
      fontSize:
        12,
      fontWeight:
        "700",
      color:
        Colors.primary,
    },

    emptyCard: {
      paddingVertical:
        60,
      paddingHorizontal:
        20,
      alignItems:
        "center",
      borderRadius:
        17,
      backgroundColor:
        Colors.cardBackground,
    },

    emptyTitle: {
      marginTop:
        12,
      fontSize:
        16,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    emptyText: {
      marginTop:
        5,
      fontSize:
        12,
      lineHeight:
        18,
      textAlign:
        "center",
      color:
        Colors.textMuted,
    },

    appointmentCard: {
      marginBottom:
        12,
      padding:
        16,
      borderRadius:
        18,
      borderWidth:
        1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    cardTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    iconBox: {
      width:
        44,
      height:
        44,
      borderRadius:
        13,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.primary,
    },

    cardTitleArea: {
      flex: 1,
      marginLeft:
        12,
      marginRight:
        8,
    },

    requestNumber: {
      fontSize:
        12,
      fontWeight:
        "700",
      color:
        Colors.gold,
    },

    appointmentType: {
      marginTop:
        3,
      fontSize:
        14,
      fontWeight:
        "700",
      color:
        Colors.white,
    },

    statusBadge: {
      paddingHorizontal:
        9,
      paddingVertical:
        5,
      borderRadius:
        12,
    },

    statusText: {
      fontSize:
        9,
      fontWeight:
        "700",
    },

    infoRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginTop:
        12,
    },

    infoText: {
      flex: 1,
      marginLeft:
        8,
      fontSize:
        11,
      color:
        Colors.textSecondary,
    },

    cardFooter: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginTop:
        14,
      paddingTop:
        12,
      borderTopWidth:
        1,
      borderTopColor:
        Colors.border,
    },

    priorityBadge: {
      paddingHorizontal:
        9,
      paddingVertical:
        5,
      borderRadius:
        10,
      backgroundColor:
        Colors.primary,
    },

    priorityBadgeHigh: {
      backgroundColor:
        "rgba(220,38,38,0.15)",
    },

    priorityText: {
      fontSize:
        9,
      fontWeight:
        "600",
      color:
        Colors.textSecondary,
    },

    priorityTextHigh: {
      color:
        "#FCA5A5",
    },

    viewRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    viewText: {
      marginRight:
        3,
      fontSize:
        11,
      fontWeight:
        "700",
      color:
        Colors.gold,
    },
  });