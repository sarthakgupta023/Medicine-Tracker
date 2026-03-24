import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const now = new Date();
  const [currentDate] = useState(now);
  const [selectedDay,  setSelectedDay]  = useState(now.getDate());

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayDay = now.getDate();

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDateClick = (day) => {
    setSelectedDay(day);
    const d = new Date(year, month, day);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    router.push({ pathname: "/dayDetails", params: { date: dateStr } });
  };

  // empty cells before first day
  const leadingBlanks = Array.from({ length: firstWeekday });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0A1628", "#0D2347", "#1A3A6B"]}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerMonth}>{MONTH_NAMES[month]}</Text>
            <Text style={styles.headerYear}>{year}</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar Card */}
          <Animated.View style={[styles.calCard, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>

            {/* Week day headers */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((wd) => (
                <Text key={wd} style={styles.weekDayLabel}>{wd}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.daysGrid}>
              {/* leading blanks */}
              {leadingBlanks.map((_, i) => (
                <View key={`blank-${i}`} style={styles.dayCell} />
              ))}

              {dates.map((d) => {
                const isToday    = d === todayDay;
                const isSelected = d === selectedDay;

                return (
                  <Pressable
                    key={d}
                    style={styles.dayCell}
                    onPress={() => handleDateClick(d)}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#4A90D9", "#2D6BB5"]}
                        style={styles.dayCellInner}
                      >
                        <Text style={styles.dayTextSelected}>{d}</Text>
                      </LinearGradient>
                    ) : isToday ? (
                      <View style={[styles.dayCellInner, styles.todayCell]}>
                        <Text style={styles.dayTextToday}>{d}</Text>
                        <View style={styles.todayDot} />
                      </View>
                    ) : (
                      <View style={styles.dayCellInner}>
                        <Text style={styles.dayText}>{d}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Month summary strip */}
          <Animated.View style={[styles.summaryStrip, { opacity: fadeAnim }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{daysInMonth}</Text>
              <Text style={styles.summaryLabel}>Days</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{todayDay}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{daysInMonth - todayDay}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </Animated.View>

          <Animated.Text style={[styles.hint, { opacity: fadeAnim }]}>
            Tap a date to view medicine log
          </Animated.Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  blob: { position: "absolute", borderRadius: 999, opacity: 0.15 },
  blobTR: { width: 280, height: 280, backgroundColor: "#4A90D9", top: -80, right: -80 },
  blobBL: { width: 220, height: 220, backgroundColor: "#2D6BB5", bottom: 40, left: -60 },

  /* ─── Header ─── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  backArrow: { fontSize: 20, color: "#fff" },
  headerCenter: { alignItems: "center" },
  headerMonth: {
    fontSize: 26, fontWeight: "800", color: "#fff",
    letterSpacing: 0.5,
  },
  headerYear: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 1 },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 40 },

  /* ─── Calendar Card ─── */
  calCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
    backdropFilter: "blur(20px)",
    overflow: "hidden",
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.5,
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  dayCellInner: {
    flex: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  todayCell: {
    backgroundColor: "rgba(74,144,217,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(74,144,217,0.5)",
  },

  dayText: {
    fontSize: 14, fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  dayTextToday: {
    fontSize: 14, fontWeight: "800",
    color: "#4A90D9",
  },
  dayTextSelected: {
    fontSize: 14, fontWeight: "800",
    color: "#fff",
  },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "#4A90D9",
    marginTop: 2,
  },

  /* ─── Summary Strip ─── */
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 14,
    paddingVertical: 18,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNum: {
    fontSize: 26, fontWeight: "800", color: "#fff",
  },
  summaryLabel: {
    fontSize: 11, color: "rgba(255,255,255,0.45)",
    fontWeight: "600", marginTop: 2,
  },
  summaryDivider: {
    width: 1, backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 4,
  },

  hint: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    marginTop: 16,
    letterSpacing: 0.3,
  },
});