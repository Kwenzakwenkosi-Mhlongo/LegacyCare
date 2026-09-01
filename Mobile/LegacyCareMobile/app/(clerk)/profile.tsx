// ============================================================
// FILE: app/(clerk)/profile.tsx
// ============================================================

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
} from "react-native-safe-area-context";

import { useAuth } from "../../src/context/AuthContext";
import Colors from "../../src/theme/colors";

export default function ClerkProfileScreen() {
  const { user } = useAuth();

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
                size={42}
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
              {user?.fullName ??
                "Clerk"}
            </Text>

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
                {user?.role ??
                  "Clerk"}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.detailsCard
            }
          >
            <ProfileRow
              icon="person-outline"
              label="Full Name"
              value={
                user?.fullName ??
                "Not available"
              }
            />

            <ProfileRow
              icon="mail-outline"
              label="Email Address"
              value={
                user?.email ??
                "Not available"
              }
            />

            <ProfileRow
              icon="shield-checkmark-outline"
              label="Role"
              value={
                user?.role ??
                "Clerk"
              }
            />

            <ProfileRow
              icon="key-outline"
              label="User ID"
              value={
                user?.userId ??
                "Not available"
              }
              last
            />
          </View>
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
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent:
        "center",
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
      color:
        Colors.white,
      textAlign: "center",
    },

    roleBadge: {
      marginTop: 9,
      paddingHorizontal: 14,
      paddingVertical: 5,
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
      justifyContent:
        "center",
      backgroundColor:
        Colors.primary,
      marginRight: 13,
    },

    rowContent: {
      flex: 1,
      justifyContent:
        "center",
    },

    rowLabel: {
      fontSize: 10,
      fontWeight: "600",
      textTransform:
        "uppercase",
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

