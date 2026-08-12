import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../src/context/AuthContext";

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

import Button from "../src/components/Button/Button";
import Input from "../src/components/Input/Input";
import API_URL from "../src/services/api";
import { saveToken } from "../src/services/auth";
import Colors from "../src/theme/colors";
import Typography from "../src/theme/typography";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/Authentication/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      await saveToken(data.token);

      const userData = {
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      };

      await login(userData, data.token);

      Alert.alert(
        "Login Successful",
        `Welcome ${data.fullName}`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (data.role === "Client") {
                router.replace("/(client)");
              } else if (data.role === "Staff") {
                router.replace("/(staff)");
              } else {
                router.replace("/");
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue managing your LegacyCare account.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color={Colors.grey}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgot}
              onPress={() => router.push("/forgot_password")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? "LOGGING IN..." : "LOGIN"}
              onPress={handleLogin}
            />

            <View style={styles.account}>
              <Text style={styles.accountText}>Don't have an account?</Text>
              <Text style={styles.link}>Contact Admin</Text>
            </View>
          </View>

          <Text style={styles.footer}>© 2026 LegacyCare</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
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
    fontSize: Typography.heading.fontSize,
    fontWeight: "700",
  },
  subtitle: {
    color: Colors.white,
    fontSize: Typography.body.fontSize,
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
    fontSize: Typography.small.fontSize,
  },
  account: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  accountText: {
    color: Colors.white,
    fontSize: Typography.small.fontSize,
  },
  link: {
    color: Colors.gold,
    fontSize: Typography.small.fontSize,
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