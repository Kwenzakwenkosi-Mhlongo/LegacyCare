import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface Event {
  eventId: string;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  venue: string;
  status: string;
  clientId: string;
  client?: {
    userId: string;
    fullName: string;
  };
  deceased?: {
    deceasedId: string;
    fullName: string;
  };
  staffMembers?: Array<{
    userId: string;
    fullName: string;
  }>;
}

const eventTypeLabels: Record<string, string> = {
  "Appointment": "Appointment",
  "Funeral": "Funeral",
  "Memorial": "Memorial",
  "ParlourRelated": "Parlour Related"
};

const statusLabels: Record<string, string> = {
  "Scheduled": "Scheduled",
  "Completed": "Completed",
  "Cancelled": "Cancelled",
  "Postponed": "Postponed"
};

export default function StaffScheduleScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadEvents = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event/staff/${user.userId}`, { headers });

      if (response.ok) {
        const data = await response.json();
        console.log('Staff events loaded:', data.length);
        setEvents(data || []);
      } else if (response.status === 404) {
        setEvents([]);
      } else {
        setError("Unable to load events.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadEvents();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getEventTypeLabel = (type: string) => {
    return eventTypeLabels[type] || type || "Unknown";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return Colors.gold;
      case "Completed": return Colors.success;
      case "Cancelled": return Colors.danger;
      case "Postponed": return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Scheduled": return styles.scheduledBadge;
      case "Completed": return styles.completedBadge;
      case "Cancelled": return styles.cancelledBadge;
      case "Postponed": return styles.postponedBadge;
      default: return styles.scheduledBadge;
    }
  };

  const renderEventCard = (event: Event) => {
    const eventDate = new Date(event.eventDate);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString("en-US", { month: "short" });
    const statusLabel = getStatusLabel(event.status);
    const statusColor = getStatusColor(event.status);
    const statusBadge = getStatusBadgeStyle(event.status);
    const eventTypeLabel = getEventTypeLabel(event.eventType);

    return (
      <View key={event.eventId} style={styles.eventCard}>
        <View style={styles.eventDate}>
          <Text style={styles.eventDay}>{day}</Text>
          <Text style={styles.eventMonth}>{month}</Text>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>
            {formatTime(event.eventDate)} • {event.venue || "No venue"}
          </Text>
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventType}>{eventTypeLabel}</Text>
            <View style={[styles.statusBadge, statusBadge]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !events.length) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={Colors.danger} />
            <Text style={styles.errorStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Pull to Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : events.length > 0 ? (
          events.map(renderEventCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyStateText}>No events scheduled</Text>
            <Text style={styles.emptyStateSubtext}>
              You have no events assigned to you
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  errorStateText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
  },
  retryButtonText: {
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
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventType: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scheduledBadge: {
    backgroundColor: Colors.gold + "20",
  },
  completedBadge: {
    backgroundColor: Colors.success + "20",
  },
  cancelledBadge: {
    backgroundColor: Colors.danger + "20",
  },
  postponedBadge: {
    backgroundColor: Colors.warning + "20",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: "500",
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});