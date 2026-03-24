import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(cardAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    if (!email.trim())        { Alert.alert("Error", "Please enter your email");    return false; }
    if (!email.includes("@")) { Alert.alert("Error", "Enter a valid email");        return false; }
    if (!password.trim())     { Alert.alert("Error", "Please enter your password"); return false; }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${api}/user/login`, {
        email:    email.trim().toLowerCase(),
        password: password.trim(),
      });
      const { token, userId, name } = response.data;
      if (token && userId) {
        await AsyncStorage.setItem("token",     token);
        await AsyncStorage.setItem("userId",    String(userId));
        await AsyncStorage.setItem("userEmail", email.trim().toLowerCase());
        if (name) await AsyncStorage.setItem("userName", name);
        router.replace("/home");
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || "Login failed. Please try again.";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />
      <View style={[styles.blob, styles.blobCenter]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── Hero ── */}
            <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

              {/* Logo: glow → blue border ring → dark bg → image */}
              <Animated.View style={[styles.glowRing, { transform: [{ scale: logoScale }] }]}>
                <View style={styles.logoOuterRing}>
                  <View style={styles.logoInnerBg}>
                    <Image
                      source={require("../assets/images/mylogo.png")}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </Animated.View>

              <Text style={styles.appName}>MediTrack</Text>
              <Text style={styles.tagline}>Your daily medicine companion</Text>

              <View style={styles.pillBadgesRow}>
                {["💉 Reminders", "📅 Schedules", "📊 Progress"].map((label) => (
                  <View key={label} style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>{label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ── Form Card ── */}
            <Animated.View style={[styles.formCard, { opacity: cardAnim }]}>

              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue</Text>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={{ marginTop: 10 }}>
                <LinearGradient
                  colors={loading ? ["#3a6ea0", "#2a5280"] : ["#4A90D9", "#2D6BB5"]}
                  style={styles.button}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login  →</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity onPress={() => router.replace("/signup")} style={styles.signupBtn} activeOpacity={0.8}>
                <Text style={styles.signupBtnText}>Create new account</Text>
              </TouchableOpacity>

            </Animated.View>

            <Animated.Text style={[styles.bottomNote, { opacity: cardAnim }]}>
              Your health data is stored securely 🔐
            </Animated.Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999 },
  blobTR:     { width: 320, height: 320, backgroundColor: "#4A90D9", opacity: 0.1,  top: -100,  right: -100 },
  blobBL:     { width: 240, height: 240, backgroundColor: "#2D6BB5", opacity: 0.12, bottom: 80, left: -80   },
  blobCenter: { width: 180, height: 180, backgroundColor: "#27AE60", opacity: 0.06, top: "35%", right: -60  },

  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 30 },

  heroSection: { alignItems: "center", marginBottom: 30 },

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

  appName: {
    fontSize: 34, fontWeight: "800", color: "#fff", letterSpacing: 1.2,
    textShadowColor: "rgba(74,144,217,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: 0.3 },

  pillBadgesRow: { flexDirection: "row", gap: 8, marginTop: 18, flexWrap: "wrap", justifyContent: "center" },
  pillBadge: {
    backgroundColor: "rgba(74,144,217,0.12)",
    borderWidth: 1, borderColor: "rgba(74,144,217,0.25)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillBadgeText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },

  formCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)", padding: 24,
  },
  formTitle:    { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 2 },
  formSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20 },

  label: {
    fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginTop: 14,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input:     { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },

  button: {
    height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center",
    shadowColor: "#4A90D9", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  dividerRow:  { flexDirection: "row", alignItems: "center", marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { color: "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: "600" },

  signupBtn: {
    height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(74,144,217,0.35)",
    backgroundColor: "rgba(74,144,217,0.08)",
  },
  signupBtnText: { color: "#4A90D9", fontWeight: "700", fontSize: 15 },

  bottomNote: {
    textAlign: "center", fontSize: 12,
    color: "rgba(255,255,255,0.2)", marginTop: 20, letterSpacing: 0.3,
  },
});