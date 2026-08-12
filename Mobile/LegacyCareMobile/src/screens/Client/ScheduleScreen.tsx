import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Button from "../../components/Button/Button";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
import { getToken } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

interface Event {
  eventId: string;
  title: string;
  eventType: string;
  description: string;
  eventDate: string;
  venue: string;
  status: string;
  clientId: string;
}

interface BookingRestriction {
  restrictionId: string;
  maxDailyBookings: number;
  minAdvanceBookingDays: number;
  eventStartTime: string;
  eventEndTime: string;
}

interface TimeSlot {
  label: string;
  value: string;
  available: boolean;
}

const eventTypes = [
  { label: "Appointment", icon: "calendar", value: "Appointment" },
  { label: "Funeral", icon: "people", value: "Funeral" },
  { label: "Memorial", icon: "heart", value: "Memorial" },
  { label: "Parlour Related", icon: "business", value: "ParlourRelated" },
];

const generateTimeSlots = (startTime: string, endTime: string, intervalMinutes: number = 60): string[] => {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const hourStr = String(currentHour).padStart(2, '0');
    const minStr = String(currentMinute).padStart(2, '0');
    slots.push(`${hourStr}:${minStr}`);
    
    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }
  
  return slots;
};

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Scheduled" | "Completed" | "Cancelled">("All");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "",
    eventType: "Appointment",
    description: "",
    eventDate: "",
    venue: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const loadBookingRestrictions = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/BookingRestriction`, { headers });
      if (response.ok) {
        const data = await response.json();
        setBookingRestrictions(data);
      }
    } catch (error) {
      console.log("Failed to load booking restrictions:", error);
    }
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
      const response = await fetch(`${API_URL}/Event/client/${user.userId}`, { headers });

      if (response.ok) {
        const data = await response.json();
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
    loadBookingRestrictions();
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadBookingRestrictions();
    await loadEvents();
  };

  const getFilteredEvents = () => {
    if (filter === "All") return events;
    return events.filter((event) => event.status === filter);
  };

  const filteredEvents = getFilteredEvents();

  const formatDateTimeString = (year: number, month: number, day: number, hours: number, minutes: number): string => {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:00`;
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setEventForm({ ...eventForm, eventDate: date });
    setSelectedTime("");
    setAvailableTimeSlots([]);
    setAvailabilityChecked(false);
    setFormErrors({ ...formErrors, eventDate: "" });

    if (!date || !bookingRestrictions) return;

    const [year, month, day] = date.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    const now = new Date();
    const minDate = new Date();
    minDate.setDate(now.getDate() + bookingRestrictions.minAdvanceBookingDays);

    if (selectedDateObj < minDate) {
      setAvailableTimeSlots([]);
      setFormErrors({ ...formErrors, eventDate: `Must be at least ${bookingRestrictions.minAdvanceBookingDays} days in advance` });
      return;
    }

    const timeSlots = generateTimeSlots(
      bookingRestrictions.eventStartTime,
      bookingRestrictions.eventEndTime,
      60
    );

    const eventsOnDate = events.filter(e => {
      const eDate = new Date(e.eventDate);
      return eDate.getFullYear() === selectedDateObj.getFullYear() &&
             eDate.getMonth() === selectedDateObj.getMonth() &&
             eDate.getDate() === selectedDateObj.getDate();
    });

    const slotsWithAvailability: TimeSlot[] = timeSlots.map((slot) => {
      const [hours, minutes] = slot.split(":").map(Number);
      
      const isTimeBooked = eventsOnDate.some(e => {
        const eDate = new Date(e.eventDate);
        return eDate.getHours() === hours && eDate.getMinutes() === minutes;
      });
      
      const isMaxBookingsReached = eventsOnDate.length >= bookingRestrictions.maxDailyBookings;
      
      return {
        label: slot,
        value: slot,
        available: !isTimeBooked && !isMaxBookingsReached
      };
    });

    setAvailableTimeSlots(slotsWithAvailability);
    setAvailabilityChecked(true);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.eventDate);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!marked[dateStr]) {
        marked[dateStr] = { dots: [{ color: Colors.gold }] };
      }
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Colors.gold,
      };
    }

    return marked;
  };

  const getMinDate = () => {
    if (!bookingRestrictions) return undefined;
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + bookingRestrictions.minAdvanceBookingDays);
    return minDate.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const handleCreateEvent = () => {
    setCreateModalVisible(true);
    setEventForm({
      title: "",
      eventType: "Appointment",
      description: "",
      eventDate: "",
      venue: "",
    });
    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimeSlots([]);
    setAvailabilityChecked(false);
    setFormErrors({});
  };

  const handleSubmitEvent = async () => {
    const errors: Record<string, string> = {};
    if (!eventForm.title) errors.title = "Please enter event title";
    if (!eventForm.eventDate) errors.eventDate = "Please select date";
    if (!selectedTime) errors.eventDate = "Please select a time";
    if (!eventForm.venue) errors.venue = "Please enter location";

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Alert.alert("Invalid Information", "Please check the form for errors.");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const [year, month, day] = eventForm.eventDate.split("-").map(Number);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      const dateTimeStr = formatDateTimeString(year, month, day, hours, minutes);

      const eventData = {
        title: eventForm.title,
        eventType: eventForm.eventType,
        description: eventForm.description,
        eventDate: dateTimeStr,
        venue: eventForm.venue,
        clientId: user?.userId,
      };

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event`, {
        method: "POST",
        headers,
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents([...events, newEvent]);
        setCreateModalVisible(false);
        setEventForm({
          title: "",
          eventType: "Appointment",
          description: "",
          eventDate: "",
          venue: "",
        });
        setSelectedDate("");
        setSelectedTime("");
        setAvailableTimeSlots([]);
        setAvailabilityChecked(false);
        Alert.alert("Success", "Event created successfully.");
        loadEvents();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to create event.");
      }
    } catch {
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setDetailModalVisible(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    
    const eventDate = new Date(selectedEvent.eventDate);
    const dateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
    
    setEventForm({
      title: selectedEvent.title,
      eventType: selectedEvent.eventType,
      description: selectedEvent.description || "",
      eventDate: dateStr,
      venue: selectedEvent.venue || "",
    });
    setSelectedDate(dateStr);
    setSelectedTime(timeStr);
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const handleUpdateEvent = async () => {
    const errors: Record<string, string> = {};
    if (!eventForm.title) errors.title = "Please enter event title";
    if (!eventForm.eventDate) errors.eventDate = "Please select date";
    if (!selectedTime) errors.eventDate = "Please select a time";
    if (!eventForm.venue) errors.venue = "Please enter location";

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      Alert.alert("Invalid Information", "Please check the form for errors.");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const [year, month, day] = eventForm.eventDate.split("-").map(Number);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      const dateTimeStr = formatDateTimeString(year, month, day, hours, minutes);

      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        eventDate: dateTimeStr,
        venue: eventForm.venue,
        clientId: user?.userId,
      };

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event/${selectedEvent?.eventId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map((e) => (e.eventId === updatedEvent.eventId ? updatedEvent : e)));
        setEditModalVisible(false);
        setEventForm({
          title: "",
          eventType: "Appointment",
          description: "",
          eventDate: "",
          venue: "",
        });
        setSelectedDate("");
        setSelectedTime("");
        Alert.alert("Success", "Event updated successfully.");
        loadEvents();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to update event.");
      }
    } catch {
      Alert.alert("Error", "Failed to update event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateEventStatus = (eventId: string, newStatus: string) => {
    setEvents(events.map((e) => 
      e.eventId === eventId ? { ...e, status: newStatus } : e
    ));
    if (selectedEvent && selectedEvent.eventId === eventId) {
      setSelectedEvent({ ...selectedEvent, status: newStatus });
    }
  };

  const handleCompleteEvent = async () => {
    if (!selectedEvent || isProcessing) return;

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event/${selectedEvent.eventId}/complete`, {
        method: "PUT",
        headers,
      });

      if (response.ok) {
        updateEventStatus(selectedEvent.eventId, "Completed");
        Alert.alert("Success", "Event marked as completed.");
        loadEvents();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to complete event.");
      }
    } catch {
      Alert.alert("Error", "Failed to complete event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEventAction = () => {
    if (!selectedEvent) return;

    Alert.alert("Cancel Event", `Are you sure you want to cancel "${selectedEvent.title}"?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          if (isProcessing) return;
          setIsProcessing(true);

          try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_URL}/Event/${selectedEvent.eventId}/cancel`, {
              method: "PUT",
              headers,
            });

            if (response.ok) {
              updateEventStatus(selectedEvent.eventId, "Cancelled");
              Alert.alert("Success", "Event cancelled.");
              loadEvents();
            } else {
              const errorText = await response.text();
              Alert.alert("Error", errorText || "Failed to cancel event.");
            }
          } catch {
            Alert.alert("Error", "Failed to cancel event. Please try again.");
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handlePostponeEvent = async () => {
    if (!selectedEvent || isProcessing) return;

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event/${selectedEvent.eventId}/postpone`, {
        method: "PUT",
        headers,
      });

      if (response.ok) {
        updateEventStatus(selectedEvent.eventId, "Postponed");
        Alert.alert("Success", "Event postponed.");
        loadEvents();
      } else {
        const errorText = await response.text();
        Alert.alert("Error", errorText || "Failed to postpone event.");
      }
    } catch {
      Alert.alert("Error", "Failed to postpone event. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteEvent = () => {
    setDetailModalVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    setIsProcessing(true);

    const deletedId = selectedEvent.eventId;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Event/${deletedId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setEvents((prev) => prev.filter((e) => e.eventId !== deletedId));
      setSelectedEvent(null);

      setDeleteModalVisible(false);
      setDetailModalVisible(false);

      Alert.alert("Success", "Event deleted successfully.");
      loadEvents();
    } catch (error) {
      Alert.alert("Error", "Failed to delete event. Please try again.");
      setDetailModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "Appointment": return Colors.info;
      case "Funeral": return Colors.danger;
      case "Memorial": return Colors.warning;
      case "ParlourRelated": return Colors.gold;
      default: return Colors.textMuted;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "Appointment": return "calendar";
      case "Funeral": return "people";
      case "Memorial": return "heart";
      case "ParlourRelated": return "business";
      default: return "ellipsis-horizontal";
    }
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
    return (
      <TouchableOpacity
        key={event.eventId}
        style={styles.eventCard}
        onPress={() => handleViewEvent(event)}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <View
              style={[
                styles.eventTypeIcon,
                {
                  backgroundColor: getEventTypeColor(event.eventType) + "20",
                },
              ]}
            >
              <Ionicons
                name={getEventIcon(event.eventType) as any}
                size={20}
                color={getEventTypeColor(event.eventType)}
              />
            </View>
            <Text style={styles.eventTypeText}>{event.eventType}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusBadgeStyle(event.status)]}>
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(event.status) },
              ]}
            >
              {event.status}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.eventDetailText}>
              {new Date(event.eventDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.eventDetailText}>
              {new Date(event.eventDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.eventDetailText}>{event.venue}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeSlots = () => {
    return (
      <View style={styles.timeSlotContainer}>
        {availableTimeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.value}
            style={[
              styles.timeSlot,
              selectedTime === slot.value && styles.timeSlotActive,
              !slot.available && styles.timeSlotUnavailable
            ]}
            onPress={() => {
              if (slot.available) {
                setSelectedTime(slot.value);
                setFormErrors({ ...formErrors, eventDate: "" });
              }
            }}
            disabled={!slot.available}
          >
            <View style={styles.timeSlotContent}>
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTime === slot.value && styles.timeSlotTextActive,
                  !slot.available && styles.timeSlotTextUnavailable
                ]}
              >
                {slot.label}
              </Text>
              {!slot.available && (
                <Ionicons name="lock-closed" size={14} color={Colors.danger} style={styles.timeSlotIcon} />
              )}
              {slot.available && selectedTime === slot.value && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.gold} style={styles.timeSlotIcon} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading && !events.length) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {["All", "Scheduled", "Completed", "Cancelled"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f as typeof filter)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={Colors.danger} />
            <Text style={styles.errorStateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Pull to Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(renderEventCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyStateText}>No Events</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first event to get started
            </Text>
            <TouchableOpacity style={styles.emptyCreateButton} onPress={handleCreateEvent}>
              <Text style={styles.emptyCreateButtonText}>+ Create New Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Event Type *</Text>
              <View style={styles.typeSelector}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      eventForm.eventType === type.value && styles.typeOptionActive,
                    ]}
                    onPress={() =>
                      setEventForm({ ...eventForm, eventType: type.value })
                    }
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={eventForm.eventType === type.value ? Colors.gold : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        eventForm.eventType === type.value &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.title && styles.inputError]}
                  placeholder="Enter event title"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.title}
                  onChangeText={(text) => {
                    setEventForm({ ...eventForm, title: text });
                    setFormErrors({ ...formErrors, title: "" });
                  }}
                />
                {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter event description"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.description}
                  onChangeText={(text) =>
                    setEventForm({ ...eventForm, description: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Date *</Text>
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={getMinDate()}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    onDayPress={(day: any) => {
                      handleDateSelect(day.dateString);
                    }}
                    markedDates={getMarkedDates()}
                    markingType="multi-dot"
                    theme={{
                      backgroundColor: Colors.primary,
                      calendarBackground: Colors.primary,
                      textSectionTitleColor: Colors.textSecondary,
                      selectedDayBackgroundColor: Colors.gold,
                      selectedDayTextColor: Colors.primary,
                      todayTextColor: Colors.gold,
                      dayTextColor: Colors.white,
                      textDisabledColor: Colors.textMuted,
                      dotColor: Colors.gold,
                      selectedDotColor: Colors.primary,
                      arrowColor: Colors.gold,
                      monthTextColor: Colors.white,
                      textMonthFontWeight: '600',
                      textDayHeaderFontWeight: '500',
                      textDayFontSize: 16,
                      textMonthFontSize: 18,
                    }}
                  />
                </View>
                {formErrors.eventDate && (
                  <Text style={styles.errorText}>{formErrors.eventDate}</Text>
                )}
              </View>

              {availableTimeSlots.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Select Time *</Text>
                  {renderTimeSlots()}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.venue && styles.inputError]}
                  placeholder="Enter location"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.venue}
                  onChangeText={(text) => {
                    setEventForm({ ...eventForm, venue: text });
                    setFormErrors({ ...formErrors, venue: "" });
                  }}
                />
                {formErrors.venue && <Text style={styles.errorText}>{formErrors.venue}</Text>}
              </View>

              <Button
                title={isProcessing ? "CREATING..." : "CREATE EVENT"}
                onPress={handleSubmitEvent}
                disabled={isProcessing || !selectedTime}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedEvent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setDetailModalVisible(false);
                  setSelectedEvent(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedEvent && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailHeader}>
                  <View
                    style={[
                      styles.detailStatusBadge,
                      getStatusBadgeStyle(selectedEvent.status),
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailStatusText,
                        { color: getStatusColor(selectedEvent.status) },
                      ]}
                    >
                      {selectedEvent.status}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.detailTypeBadge,
                      {
                        backgroundColor:
                          getEventTypeColor(selectedEvent.eventType) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailTypeText,
                        {
                          color: getEventTypeColor(selectedEvent.eventType),
                        },
                      ]}
                    >
                      {selectedEvent.eventType}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
                <Text style={styles.detailDescription}>
                  {selectedEvent.description}
                </Text>

                <View style={styles.detailInfoContainer}>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>
                      {new Date(selectedEvent.eventDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>
                      {new Date(selectedEvent.eventDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>{selectedEvent.venue}</Text>
                  </View>
                </View>

                <Text style={styles.statusSectionTitle}>Update Status</Text>
                <View style={styles.statusActions}>
                  {selectedEvent.status !== "Completed" && (
                    <TouchableOpacity
                      style={[styles.statusActionButton, styles.completeButton]}
                      onPress={handleCompleteEvent}
                      disabled={isProcessing}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={Colors.success}
                      />
                      <Text style={[styles.statusActionText, { color: Colors.success }]}>
                        Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedEvent.status !== "Cancelled" && selectedEvent.status !== "Completed" && (
                    <TouchableOpacity
                      style={[styles.statusActionButton, styles.cancelActionButton]}
                      onPress={handleCancelEventAction}
                      disabled={isProcessing}
                    >
                      <Ionicons                        name="close-circle-outline"
                        size={20}
                        color={Colors.danger}
                      />
                      <Text style={[styles.statusActionText, { color: Colors.danger }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedEvent.status !== "Postponed" && selectedEvent.status !== "Completed" && (
                    <TouchableOpacity
                      style={[styles.statusActionButton, styles.postponeButton]}
                      onPress={handlePostponeEvent}
                      disabled={isProcessing}
                    >
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={Colors.warning}
                      />
                      <Text style={[styles.statusActionText, { color: Colors.warning }]}>
                        Postpone
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.actionDivider} />

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditEvent}
                    disabled={isProcessing}
                  >
                    <Ionicons name="create-outline" size={20} color={Colors.gold} />
                    <Text style={styles.editButtonText}>Edit Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteEvent}
                    disabled={isProcessing}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEditModalVisible(false);
          setEventForm({
            title: "",
            eventType: "Appointment",
            description: "",
            eventDate: "",
            venue: "",
          });
          setSelectedDate("");
          setSelectedTime("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Event</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEventForm({
                    title: "",
                    eventType: "Appointment",
                    description: "",
                    eventDate: "",
                    venue: "",
                  });
                  setSelectedDate("");
                  setSelectedTime("");
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Event Type</Text>
                <View style={styles.readOnlyField}>
                  <Ionicons
                    name={getEventIcon(eventForm.eventType) as any}
                    size={20}
                    color={getEventTypeColor(eventForm.eventType)}
                  />
                  <Text style={styles.readOnlyText}>
                    {eventForm.eventType}
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.title && styles.inputError]}
                  placeholder="Enter event title"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.title}
                  onChangeText={(text) => {
                    setEventForm({ ...eventForm, title: text });
                    setFormErrors({ ...formErrors, title: "" });
                  }}
                />
                {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter event description"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.description}
                  onChangeText={(text) =>
                    setEventForm({ ...eventForm, description: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Date *</Text>
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={eventForm.eventDate || getMinDate()}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    onDayPress={(day: any) => {
                      handleDateSelect(day.dateString);
                    }}
                    markedDates={getMarkedDates()}
                    markingType="multi-dot"
                    theme={{
                      backgroundColor: Colors.primary,
                      calendarBackground: Colors.primary,
                      textSectionTitleColor: Colors.textSecondary,
                      selectedDayBackgroundColor: Colors.gold,
                      selectedDayTextColor: Colors.primary,
                      todayTextColor: Colors.gold,
                      dayTextColor: Colors.white,
                      textDisabledColor: Colors.textMuted,
                      dotColor: Colors.gold,
                      selectedDotColor: Colors.primary,
                      arrowColor: Colors.gold,
                      monthTextColor: Colors.white,
                      textMonthFontWeight: '600',
                      textDayHeaderFontWeight: '500',
                      textDayFontSize: 16,
                      textMonthFontSize: 18,
                    }}
                  />
                </View>
                {formErrors.eventDate && (
                  <Text style={styles.errorText}>{formErrors.eventDate}</Text>
                )}
              </View>

              {availableTimeSlots.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Select Time *</Text>
                  {renderTimeSlots()}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={[styles.modalInput, formErrors.venue && styles.inputError]}
                  placeholder="Enter location"
                  placeholderTextColor={Colors.textMuted}
                  value={eventForm.venue}
                  onChangeText={(text) => {
                    setEventForm({ ...eventForm, venue: text });
                    setFormErrors({ ...formErrors, venue: "" });
                  }}
                />
                {formErrors.venue && <Text style={styles.errorText}>{formErrors.venue}</Text>}
              </View>

              <Button
                title={isProcessing ? "UPDATING..." : "UPDATE EVENT"}
                onPress={handleUpdateEvent}
                disabled={isProcessing}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          if (selectedEvent) {
            setDetailModalVisible(true);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Event</Text>
              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(false);
                  if (selectedEvent) {
                    setDetailModalVisible(true);
                  }
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedEvent && (
              <View style={styles.modalBody}>
                <View style={styles.deleteInfo}>
                  <Ionicons name="warning-outline" size={48} color={Colors.danger} />
                  <Text style={styles.deleteTitle}>
                    Delete "{selectedEvent.title}"?
                  </Text>
                  <Text style={styles.deleteDescription}>
                    This action cannot be undone.
                  </Text>
                </View>
                <View style={styles.deleteButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelDeleteButton]}
                    onPress={() => {
                      setDeleteModalVisible(false);
                      if (selectedEvent) {
                        setDetailModalVisible(true);
                      }
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.confirmDeleteButton]}
                    onPress={confirmDeleteEvent}
                    disabled={isProcessing}
                  >
                    <Text style={styles.confirmDeleteButtonText}>
                      {isProcessing ? "DELETING..." : "DELETE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
  },
  createButton: { padding: 4 },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 6,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
  },
  filterTabActive: {
    backgroundColor: Colors.gold,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  filterTextActive: {
    color: Colors.primary,
  },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
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
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeIcon: {
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  eventTypeText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  eventDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  eventDetailText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
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
    textAlign: "center",
  },
  emptyCreateButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
  },
  emptyCreateButtonText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  largeModal: {
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  modalBody: {
    paddingVertical: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  typeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold + "20",
  },
  typeOptionText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  typeOptionTextActive: {
    color: Colors.gold,
  },
  calendarContainer: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.primary,
    minWidth: 70,
  },
  timeSlotActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold + "20",
  },
  timeSlotUnavailable: {
    opacity: 0.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + "10",
  },
  timeSlotContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeSlotIcon: {
    marginLeft: 4,
  },
  timeSlotText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  timeSlotTextActive: {
    color: Colors.gold,
  },
  timeSlotTextUnavailable: {
    color: Colors.textMuted,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  readOnlyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginLeft: 10,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailTypeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  detailInfoContainer: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailInfoText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  statusSectionTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  completeButton: {
    borderColor: Colors.success,
  },
  cancelActionButton: {
    borderColor: Colors.danger,
  },
  postponeButton: {
    borderColor: Colors.warning,
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    gap: 6,
  },
  editButtonText: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    gap: 6,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: "500",
  },
  deleteInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginTop: 12,
  },
  deleteDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  deleteButtonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelDeleteButton: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmDeleteButton: {
    backgroundColor: Colors.danger,
  },
  confirmDeleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});