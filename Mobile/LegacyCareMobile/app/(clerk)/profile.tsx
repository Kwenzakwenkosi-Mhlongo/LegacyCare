// File: app/(clerk)/profile.tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
    useCallback,
    useState,
} from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    apiRequest,
} from "../../services/api";
import Colors from "../../src/theme/colors";

type ClerkProfile = {
  userId: string;
  staffId: string;
  displayStaffId: string;
  fullName: string;
  email: string;
  role: string;
  staffRole: string;
  branchId: string;
  branchName: string;
  hireDate: string;
  isCovered: boolean;
  isActive: boolean;
};

function formatDate(
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

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export default function ClerkProfileScreen() {
  const [
    profile,
    setProfile,
  ] =
    useState<ClerkProfile | null>(
      null
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

  const loadProfile =
    useCallback(
      async (): Promise<void> => {
        try {
          setError("");

          const result =
            await apiRequest<
              ClerkProfile
            >(
              "/ClerkProfile/me"
            );

          setProfile(
            result
          );
        } catch (loadError) {
          console.log(
            "[CLERK PROFILE] ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load profile."
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

      void loadProfile();
    }, [
      loadProfile,
    ])
  );

  const onRefresh =
    async (): Promise<void> => {
      setRefreshing(true);

      await loadProfile();
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

      <SafeAreaView
        style={
          styles.safeArea
        }
        edges={[
          "top",
          "left",
          "right",
        ]}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
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
          <Text
            style={
              styles.pageTitle
            }
          >
            My Profile
          </Text>

          <Text
            style={
              styles.pageSubtitle
            }
          >
            Clerk account details
          </Text>

          {loading ? (
            <View
              style={
                styles.loadingCard
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
                Loading profile...
              </Text>
            </View>
          ) : error ? (
            <View
              style={
                styles.errorCard
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={34}
                color="#FCA5A5"
              />

              <Text
                style={
                  styles.errorTitle
                }
              >
                Unable to load profile
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <Text
                style={
                  styles.errorHint
                }
              >
                Pull down to retry.
              </Text>
            </View>
          ) : profile ? (
            <>
              <View
                style={
                  styles.profileCard
                }
              >
                <View
                  style={
                    styles.avatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={44}
                    color={
                      Colors.gold
                    }
                  />
                </View>

                <Text
                  style={
                    styles.name
                  }
                >
                  {
                    profile.fullName
                  }
                </Text>

                <Text
                  style={
                    styles.email
                  }
                >
                  {
                    profile.email
                  }
                </Text>

                <View
                  style={
                    styles.badgesRow
                  }
                >
                  <View
                    style={
                      styles.roleBadge
                    }
                  >
                    <Text
                      style={
                        styles.roleBadgeText
                      }
                    >
                      {
                        profile.role
                      }
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      profile.isActive
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    <Text
                      style={
                        styles.statusBadgeText
                      }
                    >
                      {profile.isActive
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={
                  styles.detailsCard
                }
              >
                <ProfileRow
                  icon="id-card-outline"
                  label="Staff ID"
                  value={
                    profile.displayStaffId ||
                    profile.staffId
                  }
                />

                <ProfileRow
                  icon="briefcase-outline"
                  label="Staff Role"
                  value={
                    profile.staffRole
                  }
                />

                <ProfileRow
                  icon="business-outline"
                  label="Branch"
                  value={
                    `${profile.branchName} (${profile.branchId})`
                  }
                />

                <ProfileRow
                  icon="calendar-outline"
                  label="Hire Date"
                  value={
                    formatDate(
                      profile.hireDate
                    )
                  }
                />

                <ProfileRow
                  icon="shield-checkmark-outline"
                  label="Covered"
                  value={
                    profile.isCovered
                      ? "Yes"
                      : "No"
                  }
                />

                <ProfileRow
                  icon="person-outline"
                  label="User ID"
                  value={
                    profile.userId
                  }
                  last
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        last &&
          styles.rowLast,
      ]}
    >
      <View
        style={
          styles.rowIcon
        }
      >
        <Ionicons
          name={icon}
          size={21}
          color={
            Colors.gold
          }
        />
      </View>

      <View
        style={
          styles.rowContent
        }
      >
        <Text
          style={
            styles.rowLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.rowValue
          }
          selectable
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
    },

    safeArea: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    pageTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: Colors.white,
    },

    pageSubtitle: {
      marginTop: 4,
      marginBottom: 24,
      fontSize: 13,
      color:
        Colors.textMuted,
    },

    loadingCard: {
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 13,
      color:
        Colors.textMuted,
    },

    errorCard: {
      minHeight: 220,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    errorTitle: {
      marginTop: 12,
      fontSize: 17,
      fontWeight: "700",
      color:
        Colors.white,
    },

    errorText: {
      marginTop: 8,
      textAlign: "center",
      fontSize: 12,
      lineHeight: 17,
      color: "#FCA5A5",
    },

    errorHint: {
      marginTop: 9,
      fontSize: 11,
      color:
        Colors.textMuted,
    },

    profileCard: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
    },

    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.primary,
      borderWidth: 1,
      borderColor:
        Colors.gold,
    },

    name: {
      marginTop: 16,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      color:
        Colors.white,
    },

    email: {
      marginTop: 5,
      fontSize: 12,
      textAlign: "center",
      color:
        Colors.textMuted,
    },

    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
      gap: 8,
    },

    roleBadge: {
      paddingHorizontal: 13,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor:
        Colors.primary,
    },

    roleBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color:
        Colors.gold,
    },

    statusBadge: {
      paddingHorizontal: 13,
      paddingVertical: 6,
      borderRadius: 16,
    },

    activeBadge: {
      backgroundColor:
        "rgba(34,197,94,0.18)",
    },

    inactiveBadge: {
      backgroundColor:
        "rgba(239,68,68,0.18)",
    },

    statusBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color:
        Colors.white,
    },

    detailsCard: {
      marginTop: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        Colors.border,
      backgroundColor:
        Colors.cardBackground,
      overflow: "hidden",
    },

    row: {
      flexDirection: "row",
      paddingHorizontal: 17,
      paddingVertical: 17,
      borderBottomWidth: 1,
      borderBottomColor:
        Colors.border,
    },

    rowLast: {
      borderBottomWidth: 0,
    },

    rowIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        Colors.primary,
      marginRight: 13,
    },

    rowContent: {
      flex: 1,
      justifyContent: "center",
    },

    rowLabel: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
      color:
        Colors.textMuted,
    },

    rowValue: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "500",
      color:
        Colors.white,
    },
  });