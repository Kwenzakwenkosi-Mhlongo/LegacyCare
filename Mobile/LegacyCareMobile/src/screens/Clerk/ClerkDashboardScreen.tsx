import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
import { getToken } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

interface FuneralRequest {
  funeralRequestId?: string;
  id?: string;
  status?: string;
  funeralDate?: string;
  funeralTime?: string;
  venue?: string;
  funeralType?: string;
  notes?: string;
}

interface Appointment {
  appointmentId?: string;
  id?: string;
  title?: string;
  status?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  venue?: string;
}

const quickActions = [
  {
    id: 1,
    title: "Funeral Requests",
    icon: "flower-outline",
    route: "/(clerk)/funeral-requests",
  },
  {
    id: 2,
    title: "Appointments",
    icon: "calendar-outline",
    route: "/(clerk)/appointments",
  },
  {
    id: 3,
    title: "Deploy Staff",
    icon: "people-outline",
    route: "/(clerk)/funeral-requests",
  },
  {
    id: 4,
    title: "Profile",
    icon: "person-outline",
    route: "/(clerk)/profile",
  },
];

export default function ClerkDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [funeralRequests, setFuneralRequests] = useState<
    FuneralRequest[]
  >([]);

  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const headers = await getAuthHeaders();

      /*
       * ============================================================
       * FUNERAL REQUESTS
       * ============================================================
       *
       * Adjust this endpoint only if your backend controller
       * uses a different route.
       */

      const funeralResponse = await fetch(
        `${API_URL}/FuneralRequest`,
        {
          headers,
        }
      );

      if (funeralResponse.ok) {
        const funeralData =
          await funeralResponse.json();

        if (Array.isArray(funeralData)) {
          setFuneralRequests(funeralData);
        }
      } else {
        console.log(
          "Funeral requests response:",
          funeralResponse.status
        );
      }

      /*
       * ============================================================
       * APPOINTMENTS
       * ============================================================
       */

      const appointmentResponse = await fetch(
        `${API_URL}/Appointment`,
        {
          headers,
        }
      );

      if (appointmentResponse.ok) {
        const appointmentData =
          await appointmentResponse.json();

        if (Array.isArray(appointmentData)) {
          setAppointments(appointmentData);
        }
      } else {
        console.log(
          "Appointments response:",
          appointmentResponse.status
        );
      }
    } catch (error) {
      console.log(
        "Clerk dashboard load failed:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  /*
   * ============================================================
   * COUNTS
   * ============================================================
   */

  const pendingFuneralRequests =
    funeralRequests.filter(
      (request) =>
        request.status?.toLowerCase() ===
        "pending"
    );

  const approvedFuneralRequests =
    funeralRequests.filter(
      (request) =>
        request.status?.toLowerCase() ===
        "approved"
    );

  const pendingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status?.toLowerCase() ===
        "pending"
    );

  /*
   * ============================================================
   * UPCOMING FUNERALS
   * ============================================================
   */

  const upcomingFunerals =
    funeralRequests
      .filter((request) => {
        if (!request.funeralDate) {
          return false;
        }

        const funeralDate =
          new Date(request.funeralDate);

        return (
          funeralDate >= new Date() &&
          request.status?.toLowerCase() ===
            "approved"
        );
      })
      .sort(
        (a, b) =>
          new Date(
            a.funeralDate!
          ).getTime() -
          new Date(
            b.funeralDate!
          ).getTime()
      );

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) {
      return "Date not available";
    }

    const date =
      new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <LinearGradient
      colors={[
        Colors.primary,
        Colors.secondary,
      ]}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back,
            </Text>

            <Text style={styles.userName}>
              {user?.fullName ?? "Clerk"}
            </Text>

            <Text style={styles.roleText}>
              Clerk
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {}}
          >
            <Ionicons
              name="notifications-outline"
              size={28}
              color={Colors.white}
            />

            <View
              style={styles.notificationBadge}
            />
          </TouchableOpacity>
        </View>

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>

            <View
              style={[
                styles.statCard,
                { marginRight: 12 },
              ]}
            >
              <Ionicons
                name="flower-outline"
                size={24}
                color={Colors.gold}
              />

              <Text style={styles.statValue}>
                {pendingFuneralRequests.length}
              </Text>

              <Text style={styles.statLabel}>
                Pending Funerals
              </Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={Colors.info}
              />

              <Text style={styles.statValue}>
                {approvedFuneralRequests.length}
              </Text>

              <Text style={styles.statLabel}>
                Approved Funerals
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>

            <View
              style={[
                styles.statCard,
                { marginRight: 12 },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={Colors.info}
              />

              <Text style={styles.statValue}>
                {pendingAppointments.length}
              </Text>

              <Text style={styles.statLabel}>
                Pending Appointments
              </Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="people-outline"
                size={24}
                color={Colors.gold}
              />

              <Text style={styles.statValue}>
                {upcomingFunerals.length}
              </Text>

              <Text style={styles.statLabel}>
                Upcoming Funerals
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <View style={styles.actionsGrid}>
            {quickActions.map(
              (action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() =>
                    navigateTo(
                      action.route
                    )
                  }
                >
                  <View
                    style={
                      styles.actionIcon
                    }
                  >
                    <Ionicons
                      name={
                        action.icon as any
                      }
                      size={28}
                      color={Colors.gold}
                    />
                  </View>

                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    {action.title}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* ======================================================
            PENDING FUNERAL REQUESTS
        ====================================================== */}

        <View style={styles.section}>
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Pending Funeral Requests
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigateTo(
                  "/(clerk)/funeral-requests"
                )
              }
            >
              <Text
                style={styles.viewAllText}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text
              style={styles.emptyText}
            >
              Loading requests...
            </Text>
          ) : pendingFuneralRequests.length ===
            0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={Colors.info}
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No pending funeral requests
              </Text>
            </View>
          ) : (
            pendingFuneralRequests
              .slice(0, 3)
              .map(
                (
                  request,
                  index
                ) => (
                  <TouchableOpacity
                    key={
                      request.funeralRequestId ??
                      request.id ??
                      index
                    }
                    style={
                      styles.requestCard
                    }
                    onPress={() =>
                      navigateTo(
                        `/(clerk)/funeral-requests/${
                          request.funeralRequestId ??
                          request.id
                        }`
                      )
                    }
                  >
                    <View
                      style={
                        styles.requestIcon
                      }
                    >
                      <Ionicons
                        name="flower-outline"
                        size={24}
                        color={
                          Colors.gold
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.requestInfo
                      }
                    >
                      <Text
                        style={
                          styles.requestTitle
                        }
                      >
                        Funeral Request
                      </Text>

                      <Text
                        style={
                          styles.requestVenue
                        }
                      >
                        {request.venue ??
                          "Venue not specified"}
                      </Text>

                      <Text
                        style={
                          styles.requestDate
                        }
                      >
                        {formatDate(
                          request.funeralDate
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={
                        Colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                )
              )
          )}
        </View>

        {/* ======================================================
            UPCOMING FUNERALS
        ====================================================== */}

        <View
          style={[
            styles.section,
            styles.lastSection,
          ]}
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Upcoming Funerals
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigateTo(
                  "/(clerk)/funeral-requests"
                )
              }
            >
              <Text
                style={styles.viewAllText}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {upcomingFunerals.length ===
          0 ? (
            <Text
              style={
                styles.emptyText
              }
            >
              No upcoming funerals
            </Text>
          ) : (
            upcomingFunerals
              .slice(0, 3)
              .map(
                (
                  funeral,
                  index
                ) => {
                  const date =
                    funeral.funeralDate
                      ? new Date(
                          funeral.funeralDate
                        )
                      : null;

                  return (
                    <TouchableOpacity
                      key={
                        funeral.funeralRequestId ??
                        funeral.id ??
                        index
                      }
                      style={
                        styles.eventCard
                      }
                      onPress={() =>
                        navigateTo(
                          `/(clerk)/funeral-requests/${
                            funeral.funeralRequestId ??
                            funeral.id
                          }`
                        )
                      }
                    >
                      <View
                        style={
                          styles.eventDate
                        }
                      >
                        <Text
                          style={
                            styles.eventDay
                          }
                        >
                          {date
                            ? date.getDate()
                            : "-"}
                        </Text>

                        <Text
                          style={
                            styles.eventMonth
                          }
                        >
                          {date
                            ? date.toLocaleString(
                                "en-US",
                                {
                                  month:
                                    "short",
                                }
                              )
                            : "---"}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.eventInfo
                        }
                      >
                        <Text
                          style={
                            styles.eventTitle
                          }
                        >
                          {funeral.funeralType ??
                            "Funeral"}
                        </Text>

                        <Text
                          style={
                            styles.eventTime
                          }
                        >
                          {funeral.venue ??
                            "Venue not specified"}
                        </Text>

                        <Text
                          style={
                            styles.eventStatus
                          }
                        >
                          Approved
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={
                          Colors.textMuted
                        }
                      />
                    </TouchableOpacity>
                  );
                }
              )
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },

  greeting: {
    fontSize:
      Typography.body.fontSize,
    color: Colors.textSecondary,
  },

  userName: {
    fontSize:
      Typography.heading.fontSize,
    fontWeight:
      Typography.heading.fontWeight,
    color: Colors.white,
    marginTop: 2,
  },

  roleText: {
    fontSize: 12,
    color: Colors.gold,
    marginTop: 4,
    fontWeight: "600",
  },

  notificationIcon: {
    position: "relative",
    padding: 8,
  },

  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      Colors.danger,
    borderWidth: 2,
    borderColor:
      Colors.primary,
  },

  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor:
      Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 8,
    marginBottom: 2,
  },

  statLabel: {
    fontSize:
      Typography.caption.fontSize,
    color: Colors.textMuted,
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  lastSection: {
    paddingBottom: 40,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize:
      Typography.subHeading.fontSize,
    fontWeight:
      Typography.subHeading.fontWeight,
    color: Colors.white,
    marginBottom: 16,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  actionCard: {
    width: "25%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  actionIcon: {
    backgroundColor:
      Colors.cardBackground,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },

  actionTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },

  requestCard: {
    backgroundColor:
      Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor:
      Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  requestInfo: {
    flex: 1,
  },

  requestTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 3,
  },

  requestVenue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 3,
  },

  requestDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  emptyCard: {
    backgroundColor:
      Colors.cardBackground,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  emptyText: {
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 13,
  },

  eventCard: {
    backgroundColor:
      Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  eventDate: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 50,
  },

  eventDay: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.gold,
  },

  eventMonth: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },

  eventInfo: {
    flex: 1,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 2,
  },

  eventTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  eventStatus: {
    fontSize: 11,
    color: Colors.gold,
    marginTop: 2,
  },

  viewAllText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
});