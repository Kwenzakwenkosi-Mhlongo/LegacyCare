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
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
import { getToken } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

const quickActions = [
  { id: 1, title: "View Policy", icon: "document-text", route: "policy" },
  { id: 2, title: "Make Payment", icon: "card", route: "payments" },
  { id: 3, title: "Schedule Event", icon: "calendar", route: "schedule" },
  { id: 4, title: "Profile", icon: "person", route: "profile" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [outstandingPayments, setOutstandingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [policyResponse, eventResponse, paymentResponse] = await Promise.all([
        fetch(`${API_URL}/Policy/user/${user?.userId}`, { headers }),
        fetch(`${API_URL}/Event/my-events`, { headers }),
        fetch(`${API_URL}/Payment/outstanding`, { headers }),
      ]);

      if (policyResponse.ok) {
        const policies = await policyResponse.json();
        if (policies.length > 0) {
          const mappedPolicy = {
            ...policies[0],
            packageName: policies[0].packageName || "No Package",
            monthlyPremium: policies[0].monthlyPremium || 0,
          };
          setPolicy(mappedPolicy);
        }
      }

      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEvents(eventData);
      }

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setOutstandingPayments(paymentData);
      }
    } catch (error) {
      console.log("Dashboard load failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
  };

  const navigateToTab = (route: string) => {
    router.push(route as any);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.eventDate);
      return (event.status === "Scheduled" || event.status === "Postponed") && eventDate > now;
    });
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

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
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.fullName ?? "Client"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => {}}
          >
            <Ionicons name="notifications-outline" size={28} color={Colors.white} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { marginRight: 12 }]}>
              <Ionicons name="shield-outline" size={24} color={Colors.gold} />
              <Text style={styles.statValue}>
                {policy?.packageName ?? "No Policy"}
              </Text>
              <Text style={styles.statLabel}>Active Policy</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="alert-circle-outline" size={24} color={Colors.danger} />
              <Text style={[styles.statValue, { color: Colors.danger }]}>
                {outstandingPayments.length}
              </Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { marginRight: 12 }]}>
              <Ionicons name="calendar-outline" size={24} color={Colors.info} />
              <Text style={styles.statValue}>{upcomingEvents.length}</Text>
              <Text style={styles.statLabel}>Upcoming Events</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigateToTab(action.route)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon as any} size={28} color={Colors.gold} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {outstandingPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outstanding Payments</Text>
            {outstandingPayments.slice(0, 3).map((payment: any) => (
              <View key={payment.paymentId} style={styles.outstandingCard}>
                <View style={styles.outstandingInfo}>
                  <Text style={styles.outstandingDesc}>
                    {payment.policy?.package?.name || "Payment"}
                  </Text>
                  <Text style={styles.outstandingAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
                <View style={styles.outstandingDue}>
                  <Text style={styles.outstandingDueLabel}>Due:</Text>
                  <Text style={styles.outstandingDueDate}>
                    {payment.dueDate ? formatDate(payment.dueDate) : formatDate(payment.paymentDate)}
                  </Text>
                </View>
              </View>
            ))}
            {outstandingPayments.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigateToTab("payments")}
              >
                <Text style={styles.viewAllText}>View All Payments →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.length === 0 ? (
            <Text style={{ color: Colors.textMuted, textAlign: "center", paddingVertical: 20 }}>
              No upcoming events
            </Text>
          ) : (
            upcomingEvents.slice(0, 3).map((event: any) => (
              <TouchableOpacity
                key={event.eventId}
                style={styles.eventCard}
                onPress={() => navigateToTab("schedule")}
              >
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>
                    {new Date(event.eventDate).getDate()}
                  </Text>
                  <Text style={styles.eventMonth}>
                    {new Date(event.eventDate).toLocaleString("en-US", {
                      month: "short",
                    })}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.venue}</Text>
                  <Text style={styles.eventStatus}>{event.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
          {upcomingEvents.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigateToTab("schedule")}
            >
              <Text style={styles.viewAllText}>View All Events →</Text>
            </TouchableOpacity>
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
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
    marginTop: 2,
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
    backgroundColor: Colors.danger,
    borderWidth: 2,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textMuted,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  lastSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: Typography.subHeading.fontSize,
    fontWeight: Typography.subHeading.fontWeight,
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
    backgroundColor: Colors.cardBackground,
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
  outstandingCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  outstandingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  outstandingDesc: {
    fontSize: 14,
    color: Colors.white,
    flex: 1,
  },
  outstandingAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.danger,
  },
  outstandingDue: {
    flexDirection: "row",
    alignItems: "center",
  },
  outstandingDueLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 6,
  },
  outstandingDueDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  viewAllButton: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  viewAllText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
  },
  eventCard: {
    backgroundColor: Colors.cardBackground,
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
    color: Colors.textMuted,
    marginTop: 2,
  },
});