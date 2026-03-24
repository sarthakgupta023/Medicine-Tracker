import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../private";

export default function Signup() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(cardAnim,   { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    if (!name.trim())         { Alert.alert("Error", "Please enter your name");      return false; }
    if (!email.trim())        { Alert.alert("Error", "Please enter your email");     return false; }
    if (!email.includes("@")) { Alert.alert("Error", "Please enter a valid email");  return false; }
    if (!password.trim())     { Alert.alert("Error", "Please enter a password");     return false; }
    if (password.length < 6)  { Alert.alert("Error", "Password must be ≥ 6 chars"); return false; }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${api}/user/signup`, {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (response.data === "true" || response.status === 200) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "Login Now", onPress: () => router.replace("/login") },
        ]);
      } else {
        Alert.alert("Error", "User already exists");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || "Signup failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo / Header section */}
            <Animated.View style={[styles.topSection, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }]}>
              <View style={styles.logoOuterRing}>
                  <View style={styles.logoInnerBg}>
                    <Image
                      source={require("../assets/images/mylogo.png")}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              <Text style={styles.appName}>MediTrack</Text>
              <Text style={styles.welcomeText}>Create your account</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View style={[styles.formCard, { opacity: cardAnim }]}>

              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  placeholder="Min 6 characters"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
                style={{ marginTop: 8 }}
              >
                <LinearGradient
                  colors={loading ? ["#3a6ea0", "#2a5280"] : ["#4A90D9", "#2D6BB5"]}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>Create Account →</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace("/login")} style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.15 },
  blobTR: { width: 300, height: 300, backgroundColor: "#4A90D9", top: -80, right: -80 },
  blobBL: { width: 220, height: 220, backgroundColor: "#2D6BB5", bottom: 40, left: -60 },

  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 30 },

  topSection: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(74,144,217,0.2)",
    borderWidth: 1.5, borderColor: "rgba(74,144,217,0.4)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  iconEmoji:   { fontSize: 32 },
  appName:     { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  welcomeText: { fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 4 },

  formCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 24,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  button: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  loginLink: { color: "#4A90D9", fontWeight: "700", fontSize: 14 },
  /* 3-layer logo circle */
  glowRing: {
    marginBottom: 18,
    borderRadius: 60,
    // blue outer glow
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  logoOuterRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2.5,
    borderColor: "#4A90D9",
    padding: 4,                          // gap between blue border and inner bg
    backgroundColor: "transparent",
  },
  logoInnerBg: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: "#0D1F42",          // dark navy — same as app bg
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(74,144,217,0.2)", // subtle inner ring
  },
  logo: { width: 68, height: 68 },
});