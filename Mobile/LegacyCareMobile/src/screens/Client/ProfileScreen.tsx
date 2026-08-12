import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Button from "../../components/Button/Button";
import API_URL from "../../services/api";
import { getToken, getUser, removeUser } from "../../services/auth";
import Colors from "../../theme/colors";
import Typography from "../../theme/typography";

interface ClientProfile {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  idNumber: string;
  cellNo: string;
  address: string;
  dateCreated: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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

  const getInitials = (fullName: string): string => {
    if (!fullName) return "";
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return nameParts
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const loadProfile = async () => {
    setLoading(true);

    try {
      const storedUser = await getUser();
      
      if (!storedUser?.userId) {
        Alert.alert("Error", "User not found");
        setLoading(false);
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/User/${storedUser.userId}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(storedUser);
      }
    } catch {
      Alert.alert("Error", "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const validatePassword = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword || passwordData.currentPassword.trim().length === 0) {
      errors.currentPassword = "Please enter your current password";
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      Alert.alert("Invalid Information", "Please check the form for errors.");
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();
      
      const userId = profile?.userId;
      
      if (!userId) {
        Alert.alert("Error", "User ID not found");
        setIsProcessing(false);
        return;
      }

      const response = await fetch(`${API_URL}/User/profile/password`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
        
        Alert.alert(
          "Success",
          "Your password has been changed successfully."
        );
      } else {
        const errorText = await response.text();
        
        if (response.status === 400 && errorText.toLowerCase().includes("incorrect")) {
          setPasswordErrors({ 
            ...passwordErrors, 
            currentPassword: "Current password is incorrect" 
          });
          Alert.alert("Error", "Current password is incorrect. Please try again.");
        } else {
          Alert.alert("Error", errorText || "Failed to change password.");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to change password. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const logout = async () => {
    try {
      await removeUser();

      Alert.alert("Logged Out", "You have been successfully logged out.", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to logout");
    }
  };

  if (loading && !profile) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />

          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {profile ? (
          <>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile.fullName)}</Text>
              </View>

              <Text style={styles.profileName}>{profile.fullName}</Text>

              <Text style={styles.profileEmail}>{profile.email}</Text>

              <View style={styles.memberBadge}>
                <Ionicons name="calendar-outline" size={14} color={Colors.gold} />

                <Text style={styles.memberBadgeText}>
                  Member since {new Date(profile.dateCreated).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile.role}</Text>
                <Text style={styles.statLabel}>Account Type</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>✓</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person-outline" size={20} color={Colors.gold} />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Full Name</Text>

                    <Text style={styles.infoValue}>{profile.fullName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={20} color={Colors.gold} />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email Address</Text>

                    <Text style={styles.infoValue}>{profile.email}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={20} color={Colors.gold} />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone Number</Text>

                    <Text style={styles.infoValue}>{profile.cellNo || "Not provided"}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="card-outline" size={20} color={Colors.gold} />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ID Number</Text>

                    <Text style={styles.infoValue}>{profile.idNumber || "Not provided"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="location-outline" size={20} color={Colors.gold} />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>

                    <Text style={styles.infoValue}>{profile.address || "Not provided"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Security</Text>

              <TouchableOpacity
                style={styles.securityCard}
                onPress={() => {
                  setShowPasswordModal(true);
                  setPasswordErrors({});
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <Ionicons name="lock-closed-outline" size={24} color={Colors.gold} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Change Password</Text>
                  <Text style={styles.securityText}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support</Text>

              <TouchableOpacity
                style={styles.supportCard}
                onPress={() => {
                  Alert.alert(
                    "Contact Support",
                    "How can we help you?\n\nCall: +27 11 234 5678\nEmail: support@legacycare.com",
                    [
                      {
                        text: "OK",
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="help-circle-outline" size={24} color={Colors.gold} />

                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>Help & Support</Text>

                  <Text style={styles.supportText}>Get assistance with your account</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportCard}
                onPress={() => {
                  Alert.alert(
                    "About LegacyCare",
                    "LegacyCare Mobile App\nVersion 1.0.0\n\nHonoring Lives, Supporting Families",
                    [
                      {
                        text: "OK",
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="information-circle-outline" size={24} color={Colors.gold} />

                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>About</Text>

                  <Text style={styles.supportText}>App version and information</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={Colors.danger} />

              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>© 2026 LegacyCare. All rights reserved.</Text>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={60} color={Colors.textMuted} />

            <Text style={styles.emptyStateText}>No profile data</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setPasswordErrors({});
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordErrors({});
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, passwordErrors.currentPassword && styles.inputError]}
                    placeholder="Enter current password"
                    placeholderTextColor={Colors.textMuted}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => {
                      setPasswordData({ ...passwordData, currentPassword: text });
                      setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                    }}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordErrors.currentPassword && (
                  <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, passwordErrors.newPassword && styles.inputError]}
                    placeholder="Enter new password (min 6 characters)"
                    placeholderTextColor={Colors.textMuted}
                    value={passwordData.newPassword}
                    onChangeText={(text) => {
                      setPasswordData({ ...passwordData, newPassword: text });
                      setPasswordErrors({ ...passwordErrors, newPassword: "" });
                    }}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordErrors.newPassword && (
                  <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, passwordErrors.confirmPassword && styles.inputError]}
                    placeholder="Confirm new password"
                    placeholderTextColor={Colors.textMuted}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => {
                      setPasswordData({ ...passwordData, confirmPassword: text });
                      setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={24}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {passwordErrors.confirmPassword && (
                  <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>
                )}
              </View>

              <Button
                title={isProcessing ? "UPDATING..." : "UPDATE PASSWORD"}
                onPress={handleChangePassword}
                disabled={isProcessing}
              />
            </View>
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

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
    color: Colors.white,
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

  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold + "20",
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.gold,
  },

  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginTop: 12,
  },

  profileEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },

  memberBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },

  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginHorizontal: 4,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.gold,
  },

  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoIcon: {
    width: 36,
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  infoValue: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: "500",
  },

  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  securityContent: {
    flex: 1,
    marginLeft: 12,
  },

  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  securityText: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },

  supportContent: {
    flex: 1,
    marginLeft: 12,
  },

  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  supportText: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBackground,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: 8,
    marginBottom: 20,
  },

  logoutButtonText: {
    color: Colors.danger,
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },

  footer: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
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
    maxHeight: "80%",
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

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  input: {
    flex: 1,
    backgroundColor: Colors.primary,
    color: Colors.white,
    padding: 14,
    paddingRight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
  },

  inputError: {
    borderColor: Colors.danger,
  },

  eyeIcon: {
    position: "absolute",
    right: 14,
    padding: 4,
  },

  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});