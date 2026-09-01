// File: src/screens/Clerk/ClerkDashboardScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiRequest } from "../../../services/api";
import {
  FuneralRequestDetails,
  getPendingFuneralRequests,
} from "../../../services/funeralRequest";

import { useAuth } from "../../context/AuthContext";
import Colors from "../../theme/colors";

type Appointment = {
  appointmentId?: string;
  id?: string;
  title?: string;
  status?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  venue?: string;
};

type RequestCardConfig = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  route?: string;
  count?: number;
};

function normalizeStatus(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

export default function ClerkDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { width } =
    useWindowDimensions();

  const insets =
    useSafeAreaInsets();

  const isSmallPhone =
    width < 390;

  const horizontalPadding =
    isSmallPhone
      ? 16
      : 20;

  const contentWidth =
    Math.min(
      width,
      720
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    funeralRequests,
    setFuneralRequests,
  ] =
    useState<
      FuneralRequestDetails[]
    >([]);

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      Appointment[]
    >([]);

  const [
    dashboardError,
    setDashboardError,
  ] =
    useState("");

  const loadDashboard =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setDashboardError("");

          const results =
            await Promise.allSettled([
              getPendingFuneralRequests(),

              apiRequest<
                Appointment[]
              >(
                "/Appointment"
              ),
            ]);

          const funeralResult =
            results[0];

          const appointmentResult =
            results[1];

          if (
            funeralResult.status ===
            "fulfilled"
          ) {
            setFuneralRequests(
              Array.isArray(
                funeralResult.value
              )
                ? funeralResult.value
                : []
            );
          } else {
            console.log(
              "[CLERK DASHBOARD] FUNERALS ERROR:",
              funeralResult.reason
            );

            setFuneralRequests(
              []
            );

            setDashboardError(
              funeralResult.reason instanceof
                Error
                ? funeralResult.reason.message
                : "Unable to load funeral requests."
            );
          }

          if (
            appointmentResult.status ===
            "fulfilled"
          ) {
            setAppointments(
              Array.isArray(
                appointmentResult.value
              )
                ? appointmentResult.value
                : []
            );
          } else {
            setAppointments(
              []
            );

            console.log(
              "[CLERK DASHBOARD] APPOINTMENTS ENDPOINT:",
              appointmentResult.reason
            );
          }
        } catch (error) {
          console.log(
            "[CLERK DASHBOARD] ERROR:",
            error
          );

          setDashboardError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard."
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
      if (user) {
        void loadDashboard();
      }
    }, [
      user,
      loadDashboard,
    ])
  );

  const onRefresh =
    async (): Promise<void> => {
      setRefreshing(true);

      await loadDashboard();
    };

  const navigateTo = (
    route: string
  ): void => {
    router.push(
      route as never
    );
  };

  const pendingFuneralRequests =
    useMemo(
      () =>
        funeralRequests.filter(
          (request) =>
            normalizeStatus(
              request.status
            ) === "pending"
        ),
      [
        funeralRequests,
      ]
    );

  const pendingAppointments =
    useMemo(
      () =>
        appointments.filter(
          (appointment) =>
            normalizeStatus(
              appointment.status
            ) === "pending"
        ),
      [
        appointments,
      ]
    );

  const requestCards =
    useMemo<
      RequestCardConfig[]
    >(
      () => [
        {
          id: "funeral",
          title:
            "Funeral Requests",
          icon:
            "flower-outline",
          active: true,
          route:
            "/(clerk)/funerals-requests",
          count:
            pendingFuneralRequests.length,
        },
        {
          id: "appointments",
          title:
            "Appointments",
          icon:
            "calendar-outline",
          active: true,
          route:
            "/(clerk)/appointments",
          count:
            pendingAppointments.length,
        },
        {
          id: "quote",
          title:
            "Quote Requests",
          icon:
            "document-text-outline",
          active: false,
        },
        {
          id: "beneficiary",
          title:
            "Beneficiary Requests",
          icon:
            "people-outline",
          active: false,
        },
        {
          id: "policy",
          title:
            "Policy Enquiries",
          icon:
            "shield-checkmark-outline",
          active: false,
        },
        {
          id: "payment",
          title:
            "Payment Enquiries",
          icon:
            "card-outline",
          active: false,
        },
        {
          id: "documents",
          title:
            "Document Requests",
          icon:
            "folder-open-outline",
          active: false,
        },
        {
          id: "support",
          title:
            "General Support",
          icon:
            "help-circle-outline",
          active: false,
        },
      ],
      [
        pendingFuneralRequests.length,
        pendingAppointments.length,
      ]
    );

  const handleCardPress =
    (
      card:
        RequestCardConfig
    ): void => {
      if (
        card.active &&
        card.route
      ) {
        navigateTo(
          card.route
        );

        return;
      }

      Alert.alert(
        "Coming Soon",
        `${card.title} will be available soon.`
      );
    };

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
                12
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
              onRefresh
            }
            tintColor={
              Colors.gold
            }
          />
        }
      >
        <View
          style={[
            styles.content,
            {
              width:
                contentWidth,

              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          <View
            style={
              styles.header
            }
          >
            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={[
                  styles.greeting,
                  isSmallPhone &&
                    styles.greetingSmall,
                ]}
              >
                Welcome back,
              </Text>

              <Text
                style={[
                  styles.userName,
                  isSmallPhone &&
                    styles.userNameSmall,
                ]}
                numberOfLines={
                  1
                }
              >
                {user?.fullName ??
                  "Clerk"}
              </Text>

              <Text
                style={
                  styles.roleText
                }
              >
                Clerk
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.notificationButton
              }
              activeOpacity={
                0.8
              }
              onPress={() => {
                Alert.alert(
                  "Notifications",
                  "Notifications will be available soon."
                );
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={
                  isSmallPhone
                    ? 24
                    : 27
                }
                color={
                  Colors.white
                }
              />

              {pendingFuneralRequests.length >
              0 ? (
                <View
                  style={
                    styles.notificationBadge
                  }
                />
              ) : null}
            </TouchableOpacity>
          </View>

          {dashboardError ? (
            <View
              style={
                styles.errorBanner
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#FCA5A5"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {
                  dashboardError
                }
              </Text>
            </View>
          ) : null}

          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  isSmallPhone &&
                    styles.sectionTitleSmall,
                ]}
              >
                My Requests
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Manage service requests
              </Text>
            </View>

            {loading ? (
              <Text
                style={
                  styles.loadingText
                }
              >
                Loading...
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.cardsGrid
            }
          >
            {requestCards.map(
              (card) => (
                <RequestMetricCard
                  key={
                    card.id
                  }
                  card={
                    card
                  }
                  compact={
                    isSmallPhone
                  }
                  onPress={() =>
                    handleCardPress(
                      card
                    )
                  }
                />
              )
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function RequestMetricCard({
  card,
  compact,
  onPress,
}: {
  card:
    RequestCardConfig;
  compact:
    boolean;
  onPress:
    () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        compact &&
          styles.metricCardSmall,
        !card.active &&
          styles.metricCardComingSoon,
      ]}
      activeOpacity={
        0.78
      }
      onPress={
        onPress
      }
    >
      <View
        style={
          styles.cardTopRow
        }
      >
        <View
          style={[
            styles.iconContainer,
            !card.active &&
              styles.iconContainerInactive,
          ]}
        >
          <Ionicons
            name={
              card.icon
            }
            size={
              compact
                ? 23
                : 27
            }
            color={
              card.active
                ? Colors.gold
                : Colors.textMuted
            }
          />
        </View>

        {card.active ? (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              Colors.textMuted
            }
          />
        ) : (
          <View
            style={
              styles.comingSoonBadge
            }
          >
            <Text
              style={
                styles.comingSoonText
              }
            >
              Soon
            </Text>
          </View>
        )}
      </View>

      {card.active ? (
        <Text
          style={[
            styles.metricValue,
            compact &&
              styles.metricValueSmall,
          ]}
        >
          {card.count ??
            0}
        </Text>
      ) : (
        <Text
          style={[
            styles.metricValue,
            styles.inactiveValue,
            compact &&
              styles.metricValueSmall,
          ]}
        >
          —
        </Text>
      )}

      <Text
        style={[
          styles.metricLabel,
          !card.active &&
            styles.metricLabelInactive,
          compact &&
            styles.metricLabelSmall,
        ]}
        numberOfLines={
          2
        }
      >
        {card.title}
      </Text>

      <Text
        style={[
          styles.cardStatus,
          card.active
            ? styles.cardStatusActive
            : styles.cardStatusInactive,
        ]}
      >
        {card.active
          ? "Open requests"
          : "Coming soon"}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      alignItems:
        "center",
    },

    content: {
      alignSelf:
        "center",
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 10,
      marginBottom: 28,
    },

    headerText: {
      flex: 1,
      paddingRight: 12,
    },

    greeting: {
      fontSize: 16,
      color:
        Colors.textSecondary,
    },

    greetingSmall: {
      fontSize: 13,
    },

    userName: {
      marginTop: 2,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700",
      color: Colors.white,
    },

    userNameSmall: {
      fontSize: 24,
      lineHeight: 29,
    },

    roleText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "600",
      color: Colors.gold,
    },

    notificationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      position:
        "relative",
    },

    notificationBadge: {
      position:
        "absolute",
      top: 7,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        Colors.danger,
    },

    errorBanner: {
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 11,
      borderRadius: 10,
      marginBottom: 18,
      backgroundColor:
        "rgba(220,38,38,0.15)",
    },

    errorText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 12,
      color: "#FCA5A5",
    },

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    sectionTitle: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
      color: Colors.white,
    },

    sectionTitleSmall: {
      fontSize: 21,
      lineHeight: 27,
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color:
        Colors.textMuted,
    },

    loadingText: {
      fontSize: 11,
      color:
        Colors.textMuted,
    },

    cardsGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
      rowGap: 14,
    },

    metricCard: {
      width: "48.4%",
      minHeight: 172,
      padding: 16,
      borderRadius: 19,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    metricCardSmall: {
      minHeight: 158,
      padding: 14,
      borderRadius: 17,
    },

    metricCardComingSoon: {
      opacity: 0.72,
    },

    cardTopRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    iconContainer: {
      width: 43,
      height: 43,
      borderRadius: 13,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        Colors.primary,
    },

    iconContainerInactive: {
      opacity: 0.75,
    },

    comingSoonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.primary,
    },

    comingSoonText: {
      fontSize: 9,
      fontWeight: "700",
      color:
        Colors.textMuted,
    },

    metricValue: {
      marginTop: 18,
      fontSize: 27,
      lineHeight: 31,
      fontWeight: "700",
      color: Colors.white,
    },

    metricValueSmall: {
      fontSize: 23,
      lineHeight: 27,
    },

    inactiveValue: {
      color:
        Colors.textMuted,
    },

    metricLabel: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      color: Colors.white,
    },

    metricLabelSmall: {
      fontSize: 12,
      lineHeight: 16,
    },

    metricLabelInactive: {
      color:
        Colors.textSecondary,
    },

    cardStatus: {
      marginTop: 6,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "500",
    },

    cardStatusActive: {
      color:
        Colors.gold,
    },

    cardStatusInactive: {
      color:
        Colors.textMuted,
    },
  });