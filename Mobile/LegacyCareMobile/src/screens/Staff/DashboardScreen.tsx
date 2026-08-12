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
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../services/api";
import { getToken } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

interface Task {
  taskId: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  dueDate: string;
  assignedToId: string;
  policyId?: string;
  deceasedId?: string;
  createdDate: string;
  proofImagePath?: string;
  assignedTo?: {
    userId: string;
    fullName: string;
    email: string;
  };
  policy?: {
    policyId: string;
    package?: {
      name: string;
    };
  };
  deceased?: {
    deceasedId: string;
    fullName: string;
  };
}

interface StaffProfile {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  cellNo: string;
}

// Status labels matching backend
const statusLabels: Record<string, string> = {
  "NotStarted": "Not Started",
  "InProgress": "In Progress",
  "Completed": "Completed"
};

const statusColors: Record<string, string> = {
  "NotStarted": Colors.warning,
  "InProgress": Colors.info,
  "Completed": Colors.success
};

const statusOptions = [
  { label: "Not Started", value: "NotStarted" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
];

const statusMapToNumber: Record<string, number> = {
  "NotStarted": 0,
  "InProgress": 1,    
  "Completed": 2      
};

export default function StaffTasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<"All" | "NotStarted" | "InProgress" | "Completed">("All");

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

  const loadStaffProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/User/${user?.userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setStaffProfile(data);
      }
    } catch (error) {
      console.log("Failed to load staff profile:", error);
    }
  };

  const loadTasks = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/Task/staff/${user.userId}`, { headers });

      if (response.ok) {
        const data = await response.json();
        console.log('Tasks loaded:', data.length);
        if (data.length > 0) {
          console.log('First task:', JSON.stringify(data[0], null, 2));
        }
        setTasks(data || []);
      } else if (response.status === 404) {
        setTasks([]);
      } else {
        setError("Unable to load tasks.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadStaffProfile();
    loadTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadStaffProfile();
    await loadTasks();
  };

  const getFilteredTasks = () => {
    if (filter === "All") return tasks;
    return tasks.filter((task) => task.status === filter);
  };

  const filteredTasks = getFilteredTasks();

  const getTaskCountByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status).length;
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status || "Unknown";
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || Colors.textMuted;
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "NotStarted":
        return styles.pendingBadge;
      case "InProgress":
        return styles.inProgressBadge;
      case "Completed":
        return styles.completedBadge;
      default:
        return styles.pendingBadge;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleUpdateStatus = (task: Task) => {
    setSelectedTask(task);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async (newStatus: string) => {
    if (!selectedTask) return;

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();
      const statusNumber = statusMapToNumber[newStatus];
      
      console.log('Updating status:', selectedTask.taskId, 'to:', newStatus, 'value:', statusNumber);

      const response = await fetch(
        `${API_URL}/Task/${selectedTask.taskId}/status?status=${statusNumber}`,
        {
          method: "PUT",
          headers,
        }
      );

      if (response.ok) {
        setTasks(
          tasks.map((task) =>
            task.taskId === selectedTask.taskId ? { ...task, status: newStatus } : task
          )
        );

        Alert.alert("Status Updated", `Task status has been updated to "${getStatusLabel(newStatus)}".`, [
          {
            text: "OK",
            onPress: () => {
              setShowStatusModal(false);
              setSelectedTask(null);
            },
          },
        ]);
      } else {
        const errorText = await response.text();
        console.log('Update failed:', errorText);
        Alert.alert("Error", errorText || "Failed to update task status.");
      }
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert("Error", "Failed to update task status. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTaskCard = (task: Task) => {
    const statusLabel = getStatusLabel(task.status);
    const statusColor = getStatusColor(task.status);
    const statusBadge = getStatusBadgeStyle(task.status);

    return (
      <TouchableOpacity
        key={task.taskId}
        style={styles.taskCard}
        onPress={() => handleViewTask(task)}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={[styles.statusBadge, statusBadge]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskDetails}>
          <View style={styles.taskDetailItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.taskDetailText}>Due: {formatDate(task.dueDate)}</Text>
          </View>
          <View style={styles.taskDetailItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.taskDetailText}>{formatTime(task.dueDate)}</Text>
          </View>
          {task.deceased && (
            <View style={styles.taskDetailItem}>
              <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.taskDetailText}>{task.deceased.fullName}</Text>
            </View>
          )}
        </View>

        {task.status !== "Completed" && (
          <TouchableOpacity
            style={styles.updateStatusButton}
            onPress={() => handleUpdateStatus(task)}
          >
            <Text style={styles.updateStatusText}>Update Status</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !tasks.length) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getTaskCountByStatus("NotStarted")}</Text>
          <Text style={styles.statLabel}>Not Started</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.info }]}>
            {getTaskCountByStatus("InProgress")}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {getTaskCountByStatus("Completed")}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {["All", "Not Started", "In Progress", "Completed"].map((f, index) => {
          const statusMap = ["All", "NotStarted", "InProgress", "Completed"];
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                filter === statusMap[index] && styles.filterTabActive,
              ]}
              onPress={() => setFilter(statusMap[index] as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === statusMap[index] && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
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
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(renderTaskCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={60} color={Colors.textMuted} />
            <Text style={styles.emptyStateText}>No tasks</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === "All" ? "You have no assigned tasks" : `No ${filter === "NotStarted" ? "pending" : filter === "InProgress" ? "in progress" : "completed"} tasks`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* View Task Modal */}
      <Modal
        visible={showTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Details</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedTask && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailHeader}>
                  <View style={[styles.statusBadge, getStatusBadgeStyle(selectedTask.status)]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedTask.status) }]}>
                      {getStatusLabel(selectedTask.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedTask.title}</Text>
                <Text style={styles.detailDescription}>{selectedTask.description}</Text>

                <View style={styles.detailInfoContainer}>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>Start: {formatDate(selectedTask.startDate)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>Due: {formatDate(selectedTask.dueDate)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.detailInfoText}>Time: {formatTime(selectedTask.dueDate)}</Text>
                  </View>
                  {selectedTask.deceased && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                      <Text style={styles.detailInfoText}>Deceased: {selectedTask.deceased.fullName}</Text>
                    </View>
                  )}
                  {selectedTask.policy && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />
                      <Text style={styles.detailInfoText}>
                        Policy: {selectedTask.policy.package?.name || selectedTask.policy.policyId || "N/A"}
                      </Text>
                    </View>
                  )}
                  {selectedTask.assignedTo && (
                    <View style={styles.detailInfoRow}>
                      <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                      <Text style={styles.detailInfoText}>Assigned to: {selectedTask.assignedTo.fullName || "Staff"}</Text>
                    </View>
                  )}
                </View>

                {selectedTask.status !== "Completed" && (
                  <TouchableOpacity
                    style={styles.modalUpdateButton}
                    onPress={() => {
                      setShowTaskModal(false);
                      handleUpdateStatus(selectedTask);
                    }}
                  >
                    <Text style={styles.modalUpdateButtonText}>Update Status</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.statusModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedTask && (
              <View style={styles.modalBody}>
                <Text style={styles.statusModalTask}>{selectedTask.title}</Text>
                <Text style={styles.statusModalCurrent}>
                  Current: {getStatusLabel(selectedTask.status)}
                </Text>

                <View style={styles.statusOptions}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusOption,
                        selectedTask.status === option.value && styles.statusOptionActive,
                      ]}
                      onPress={() => confirmStatusUpdate(option.value)}
                      disabled={isProcessing}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          selectedTask.status === option.value && styles.statusOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.warning,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
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
  taskCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: Colors.warning + "20",
  },
  inProgressBadge: {
    backgroundColor: Colors.info + "20",
  },
  completedBadge: {
    backgroundColor: Colors.success + "20",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  taskDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  taskDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 2,
  },
  taskDetailText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  updateStatusButton: {
    backgroundColor: Colors.gold + "20",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  updateStatusText: {
    color: Colors.gold,
    fontSize: 14,
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
    maxHeight: "85%",
  },
  statusModal: {
    maxHeight: "60%",
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
  detailHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
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
    marginLeft: 10,
  },
  modalUpdateButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalUpdateButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  statusModalTask: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
  },
  statusModalCurrent: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  statusOptions: {
    gap: 10,
  },
  statusOption: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statusOptionActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold + "20",
  },
  statusOptionText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  statusOptionTextActive: {
    color: Colors.gold,
  },
});