import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.82)).current;
  const dotAnim1   = useRef(new Animated.Value(0)).current;
  const dotAnim2   = useRef(new Animated.Value(0)).current;
  const dotAnim3   = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(taglineAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(160, [
        Animated.spring(dotAnim1, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.spring(dotAnim2, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.spring(dotAnim3, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    const checkUser = async () => {
      try {
        const token  = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        setTimeout(() => {
          router.replace(token && userId ? "/home" : "/login");
        }, 2400);
      } catch {
        router.replace("/login");
      }
    };
    checkUser();
  }, []);

  return (
    <LinearGradient
      colors={["#0A1628", "#0D2347", "#1A3A6B"]}
      style={styles.gradient}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.inner}>

          {/* Glow ring behind logo */}
          <View style={styles.glowRing}>
            <Animated.View style={[styles.logoWrap, {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }]}>
              <LinearGradient
                colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]}
                style={styles.logoCard}
              >
                <Image
                  source={require("../assets/images/mylogo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* App name */}
          <Animated.Text style={[styles.appName, { opacity: taglineAnim }]}>
            MediTrack
          </Animated.Text>
          <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
            Never miss a dose again
          </Animated.Text>

          {/* Loading dots */}
          <View style={styles.dotsRow}>
            {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
              <Animated.View
                key={i}
                style={[styles.dot, {
                  opacity: anim,
                  transform: [{ scale: anim }],
                }]}
              />
            ))}
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.18,
  },
  blobTop: {
    width: 320, height: 320,
    backgroundColor: "#4A90D9",
    top: -80, right: -80,
  },
  blobBottom: {
    width: 260, height: 260,
    backgroundColor: "#2D6BB5",
    bottom: -60, left: -60,
  },

  glowRing: {
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(74,144,217,0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  logoWrap: {
    width: 154, height: 154,
    borderRadius: 77,
    overflow: "hidden",
  },
  logoCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 77,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
  },
  logo: { width: 110, height: 110 },

  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    marginTop: 8,
    textShadowColor: "rgba(74,144,217,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.5,
    fontWeight: "500",
  },

  dotsRow: { flexDirection: "row", gap: 10, marginTop: 28 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#4A90D9",
  },
});