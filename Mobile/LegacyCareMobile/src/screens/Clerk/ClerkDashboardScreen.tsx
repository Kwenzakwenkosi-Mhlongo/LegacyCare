// File: src/screens/Clerk/ClerkDashboardScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Modal,
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

const READ_NOTIFICATIONS_KEY =
  "legacycare_clerk_read_notifications";

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

type ClerkNotification = {
  id: string;
  title: string;
  message: string;
  route?: string;
  createdDate?: string | null;
};

function normalizeStatus(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function formatNotificationDate(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
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

export default function ClerkDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    funeralRequests,
    setFuneralRequests,
  ] = useState<
    FuneralRequestDetails[]
  >([]);

  const [
    appointments,
    setAppointments,
  ] = useState<
    Appointment[]
  >([]);

  const [
    dashboardError,
    setDashboardError,
  ] = useState("");

  const [
    notificationModalVisible,
    setNotificationModalVisible,
  ] = useState(false);

  const [
    readNotificationIds,
    setReadNotificationIds,
  ] = useState<string[]>([]);

  const loadReadNotifications =
    useCallback(
      async (): Promise<void> => {
        try {
          const stored =
            await AsyncStorage.getItem(
              READ_NOTIFICATIONS_KEY
            );

          if (!stored) {
            setReadNotificationIds(
              []
            );

            return;
          }

          const parsed =
            JSON.parse(
              stored
            );

          setReadNotificationIds(
            Array.isArray(parsed)
              ? parsed
              : []
          );
        } catch (error) {
          console.log(
            "[CLERK NOTIFICATIONS] LOAD ERROR:",
            error
          );

          setReadNotificationIds(
            []
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadReadNotifications();
  }, [
    loadReadNotifications,
  ]);

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
        void loadReadNotifications();
      }
    }, [
      user,
      loadDashboard,
      loadReadNotifications,
    ])
  );

  const onRefresh =
    async (): Promise<void> => {
      setRefreshing(true);

      await Promise.all([
        loadDashboard(),
        loadReadNotifications(),
      ]);
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

  const notifications =
    useMemo<
      ClerkNotification[]
    >(
      () =>
        pendingFuneralRequests.map(
          (request) => {
            const assigned =
              request.staffAssigned ??
              request.staffDeployed
                ?.length ??
              0;

            const required =
              request.staffRequired ??
              4;

            const ready =
              assigned >=
              required;

            return {
              id:
                `funeral-${request.funeralRequestId}`,

              title:
                ready
                  ? "Funeral Ready for Approval"
                  : "Pending Funeral Request",

              message:
                ready
                  ? `${request.funeralType || "Funeral"} has ${assigned}/${required} staff assigned and is ready for review.`
                  : `${request.funeralType || "Funeral"} requires staff assignment. Currently ${assigned}/${required}.`,

              route:
                `/(clerk)/funerals-requests/${request.funeralRequestId}`,

              createdDate:
                request.createdDate,
            };
          }
        ),
      [
        pendingFuneralRequests,
      ]
    );

  const unreadNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !readNotificationIds.includes(
              notification.id
            )
        ),
      [
        notifications,
        readNotificationIds,
      ]
    );

  const saveReadNotificationIds =
    async (
      ids: string[]
    ): Promise<void> => {
      const uniqueIds =
        Array.from(
          new Set(ids)
        );

      setReadNotificationIds(
        uniqueIds
      );

      await AsyncStorage.setItem(
        READ_NOTIFICATIONS_KEY,
        JSON.stringify(
          uniqueIds
        )
      );
    };

  const markNotificationRead =
    async (
      notificationId: string
    ): Promise<void> => {
      if (
        readNotificationIds.includes(
          notificationId
        )
      ) {
        return;
      }

      await saveReadNotificationIds([
        ...readNotificationIds,
        notificationId,
      ]);
    };

  const markAllNotificationsRead =
    async (): Promise<void> => {
      const allNotificationIds =
        notifications.map(
          (notification) =>
            notification.id
        );

      await saveReadNotificationIds([
        ...readNotificationIds,
        ...allNotificationIds,
      ]);
    };

  const handleNotificationPress =
    async (
      notification:
        ClerkNotification
    ): Promise<void> => {
      try {
        await markNotificationRead(
          notification.id
        );

        setNotificationModalVisible(
          false
        );

        if (
          notification.route
        ) {
          navigateTo(
            notification.route
          );
        }
      } catch (error) {
        console.log(
          "[CLERK NOTIFICATION] ERROR:",
          error
        );
      }
    };

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
              onPress={() =>
                setNotificationModalVisible(
                  true
                )
              }
            >
              <Ionicons
                name="notifications-outline"
                size={
                  isSmallPhone
                    ? 25
                    : 28
                }
                color={
                  Colors.white
                }
              />

              {unreadNotifications.length >
              0 ? (
                <View
                  style={
                    styles.notificationBadge
                  }
                >
                  <Text
                    style={
                      styles.notificationBadgeText
                    }
                  >
                    {unreadNotifications.length >
                    99
                      ? "99+"
                      : unreadNotifications.length}
                  </Text>
                </View>
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

      <Modal
        visible={
          notificationModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setNotificationModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.notificationModal,
              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    18
                  ),
              },
            ]}
          >
            <View
              style={
                styles.notificationHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.notificationTitle
                  }
                >
                  Notifications
                </Text>

                <Text
                  style={
                    styles.notificationSubtitle
                  }
                >
                  {unreadNotifications.length} unread
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={() =>
                  setNotificationModalVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={
                    Colors.white
                  }
                />
              </TouchableOpacity>
            </View>

            {notifications.length >
            0 ? (
              <View
                style={
                  styles.notificationActions
                }
              >
                <TouchableOpacity
                  onPress={() => {
                    void markAllNotificationsRead();
                  }}
                >
                  <Text
                    style={
                      styles.markAllText
                    }
                  >
                    Mark all read
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {notifications.length ===
              0 ? (
                <View
                  style={
                    styles.emptyNotifications
                  }
                >
                  <Ionicons
                    name="notifications-off-outline"
                    size={42}
                    color={
                      Colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.emptyNotificationTitle
                    }
                  >
                    No notifications
                  </Text>

                  <Text
                    style={
                      styles.emptyNotificationText
                    }
                  >
                    You are all caught up.
                  </Text>
                </View>
              ) : (
                notifications.map(
                  (
                    notification
                  ) => {
                    const isRead =
                      readNotificationIds.includes(
                        notification.id
                      );

                    return (
                      <TouchableOpacity
                        key={
                          notification.id
                        }
                        style={[
                          styles.notificationCard,
                          !isRead &&
                            styles.notificationCardUnread,
                        ]}
                        activeOpacity={
                          0.8
                        }
                        onPress={() => {
                          void handleNotificationPress(
                            notification
                          );
                        }}
                      >
                        <View
                          style={
                            styles.notificationIcon
                          }
                        >
                          <Ionicons
                            name="flower-outline"
                            size={21}
                            color={
                              Colors.gold
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.notificationContent
                          }
                        >
                          <View
                            style={
                              styles.notificationCardHeader
                            }
                          >
                            <Text
                              style={
                                styles.notificationCardTitle
                              }
                            >
                              {
                                notification.title
                              }
                            </Text>

                            {!isRead ? (
                              <View
                                style={
                                  styles.unreadDot
                                }
                              />
                            ) : null}
                          </View>

                          <Text
                            style={
                              styles.notificationMessage
                            }
                          >
                            {
                              notification.message
                            }
                          </Text>

                          {notification.createdDate ? (
                            <Text
                              style={
                                styles.notificationDate
                              }
                            >
                              {formatNotificationDate(
                                notification.createdDate
                              )}
                            </Text>
                          ) : null}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={19}
                          color={
                            Colors.textMuted
                          }
                        />
                      </TouchableOpacity>
                    );
                  }
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

      <Text
        style={[
          styles.metricValue,
          !card.active &&
            styles.inactiveValue,
          compact &&
            styles.metricValueSmall,
        ]}
      >
        {card.active
          ? card.count ?? 0
          : "—"}
      </Text>

      <Text
        style={[
          styles.metricLabel,
          !card.active &&
            styles.metricLabelInactive,
          compact &&
            styles.metricLabelSmall,
        ]}
        numberOfLines={2}
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
      alignItems: "center",
    },

    content: {
      alignSelf: "center",
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 28,
    },

    headerText: {
      flex: 1,
      paddingRight: 12,
    },

    greeting: {
      fontSize: 16,
      color: Colors.textSecondary,
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
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    notificationBadge: {
      position: "absolute",
      top: 3,
      right: 1,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 5,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.danger,
      borderWidth: 2,
      borderColor: Colors.primary,
    },

    notificationBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: Colors.white,
    },

    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
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
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
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
      color: Colors.textMuted,
    },

    loadingText: {
      fontSize: 11,
      color: Colors.textMuted,
    },

    cardsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 14,
    },

    metricCard: {
      width: "48.4%",
      minHeight: 172,
      padding: 16,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: Colors.border,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    iconContainer: {
      width: 43,
      height: 43,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.primary,
    },

    iconContainerInactive: {
      opacity: 0.75,
    },

    comingSoonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.primary,
    },

    comingSoonText: {
      fontSize: 9,
      fontWeight: "700",
      color: Colors.textMuted,
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
      color: Colors.textMuted,
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
      color: Colors.textSecondary,
    },

    cardStatus: {
      marginTop: 6,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "500",
    },

    cardStatusActive: {
      color: Colors.gold,
    },

    cardStatusInactive: {
      color: Colors.textMuted,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.65)",
    },

    notificationModal: {
      maxHeight: "78%",
      paddingTop: 20,
      paddingHorizontal: 20,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: Colors.border,
      backgroundColor:
        Colors.secondary,
    },

    notificationHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    notificationTitle: {
      fontSize: 23,
      fontWeight: "700",
      color: Colors.white,
    },

    notificationSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: Colors.textMuted,
    },

    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.primary,
    },

    notificationActions: {
      alignItems: "flex-end",
      marginTop: 8,
      marginBottom: 12,
    },

    markAllText: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.gold,
    },

    notificationCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      marginBottom: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    notificationCardUnread: {
      borderColor: Colors.gold,
    },

    notificationIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor: Colors.primary,
    },

    notificationContent: {
      flex: 1,
      paddingRight: 8,
    },

    notificationCardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    notificationCardTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: Colors.white,
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
      backgroundColor: Colors.danger,
    },

    notificationMessage: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 16,
      color: Colors.textSecondary,
    },

    notificationDate: {
      marginTop: 6,
      fontSize: 9,
      color: Colors.textMuted,
    },

    emptyNotifications: {
      minHeight: 230,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyNotificationTitle: {
      marginTop: 13,
      fontSize: 16,
      fontWeight: "700",
      color: Colors.white,
    },

    emptyNotificationText: {
      marginTop: 5,
      fontSize: 12,
      color: Colors.textMuted,
    },
  });