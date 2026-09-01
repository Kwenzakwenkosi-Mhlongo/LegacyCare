// app/login.tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { apiRequest } from "../services/api";
import Button from "../src/components/Button/Button";
import Input from "../src/components/Input/Input";
import { useAuth } from "../src/context/AuthContext";
import Colors from "../src/theme/colors";
import Typography from "../src/theme/typography";

type LoginResponse = {
  token?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function requireString(
  value: string | undefined,
  fieldName: string
): string {
  const cleanedValue = value?.trim();

  if (!cleanedValue) {
    throw new Error(
      `Login response is missing ${fieldName}.`
    );
  }

  return cleanedValue;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (): Promise<void> => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter your email address and password."
      );

      return;
    }

    try {
      setIsLoading(true);

      const data = await apiRequest<LoginResponse>(
        "/Authentication/login",
        {
          method: "POST",
          authenticated: false,
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      const token = requireString(
        data.token,
        "token"
      );

      const userId = requireString(
        data.userId,
        "userId"
      );

      const fullName = requireString(
        data.fullName,
        "fullName"
      );

      const role = requireString(
        data.role,
        "role"
      );

      const userEmail =
        data.email?.trim() ||
        cleanEmail;

      const userData = {
        userId,
        fullName,
        email: userEmail,
        role,
      };

      await login(
        userData,
        token
      );

      const normalizedRole =
        normalizeRole(role);

      Alert.alert(
        "Login Successful",
        `Welcome ${fullName}`,
        [
          {
            text: "Continue",
            onPress: () => {
              switch (normalizedRole) {
                case "client":
                  router.replace(
                    "/(client)"
                  );
                  return;

                case "clerk":
                  router.replace(
                    "/(clerk)"
                  );
                  return;

                case "staff":
                  router.replace(
                    "/(staff)"
                  );
                  return;

                default:
                  Alert.alert(
                    "Access Error",
                    `The role "${role}" does not have a configured mobile dashboard.`
                  );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "[LOGIN] ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in.";

      Alert.alert(
        "Login Failed",
        message
      );
    } finally {
      setIsLoading(false);
    }
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
        backgroundColor={
          Colors.primary
        }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backButton
              }
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <View
            style={styles.header}
          >
            <Text
              style={styles.title}
            >
              Welcome Back
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Sign in to continue managing your LegacyCare account.
            </Text>
          </View>

          <View
            style={styles.form}
          >
            <Input
              placeholder="Email Address"
              value={email}
              onChangeText={
                setEmail
              }
              keyboardType="email-address"
            />

            <View
              style={
                styles.passwordContainer
              }
            >
              <Input
                placeholder="Password"
                value={password}
                onChangeText={
                  setPassword
                }
                secureTextEntry={
                  !showPassword
                }
              />

              <TouchableOpacity
                style={
                  styles.eyeButton
                }
                onPress={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye"
                      : "eye-off"
                  }
                  size={22}
                  color={
                    Colors.grey
                  }
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgot}
              onPress={() =>
                router.push(
                  "/forgot_password"
                )
              }
            >
              <Text
                style={
                  styles.forgotText
                }
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <View
              style={
                isLoading
                  ? styles.disabled
                  : undefined
              }
              pointerEvents={
                isLoading
                  ? "none"
                  : "auto"
              }
            >
              <Button
                title={
                  isLoading
                    ? "LOGGING IN..."
                    : "LOGIN"
                }
                onPress={
                  handleLogin
                }
              />
            </View>

            <View
              style={
                styles.account
              }
            >
              <Text
                style={
                  styles.accountText
                }
              >
                Don't have an account?
              </Text>

              <Text
                style={styles.link}
              >
                Contact Admin
              </Text>
            </View>
          </View>

          <Text
            style={styles.footer}
          >
            © 2026 LegacyCare
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 30,
    },

    backButton: {
      color: Colors.gold,
      fontSize: 16,
    },

    header: {
      marginTop: 30,
      marginBottom: 40,
    },

    title: {
      color: Colors.white,
      fontSize:
        Typography.heading.fontSize,
      fontWeight: "700",
    },

    subtitle: {
      color: Colors.white,
      fontSize:
        Typography.body.fontSize,
      marginTop: 10,
      lineHeight: 22,
    },

    form: {
      flex: 1,
    },

    passwordContainer: {
      position: "relative",
    },

    eyeButton: {
      position: "absolute",
      right: 20,
      top: 30,
    },

    forgot: {
      alignSelf: "flex-end",
      marginTop: 12,
    },

    forgotText: {
      color: Colors.gold,
      fontSize:
        Typography.small.fontSize,
    },

    disabled: {
      opacity: 0.65,
    },

    account: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 25,
    },

    accountText: {
      color: Colors.white,
      fontSize:
        Typography.small.fontSize,
    },

    link: {
      color: Colors.gold,
      fontSize:
        Typography.small.fontSize,
      fontWeight: "600",
      marginLeft: 5,
    },

    footer: {
      textAlign: "center",
      color: Colors.white,
      fontSize: 12,
      marginTop: 40,
    },
  });