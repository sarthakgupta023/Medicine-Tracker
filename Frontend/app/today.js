import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../private";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

// ─── TodayCard ────────────────────────────────────────────────────────────────

function TodayCard({ item, schedule, onTaken, index }) {
  const [loading, setLoading] = useState(false);
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  // staggered entrance animation
  useState(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  });

  const times    = schedule?.times || [];
  const isLow    = item.quantity < 5;

  const handleTaken = async () => {
    // shrink + fade out animation on taken
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setLoading(true);
      await onTaken(item);
      setLoading(false);
    });
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isLow && styles.cardLow,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, isLow && styles.accentBarLow]} />

      <View style={styles.cardContent}>

        {/* Top row — name + quantity badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.nameRow}>
            <View style={[styles.dot, isLow && styles.dotLow]} />
            <Text style={styles.medicineName}>{item.name}</Text>
          </View>
          <View style={[styles.qtyBadge, isLow && styles.qtyBadgeLow]}>
            <Text style={[styles.qtyText, isLow && styles.qtyTextLow]}>
              {item.quantity} left{isLow ? " ⚠️" : ""}
            </Text>
          </View>
        </View>

        {/* Timings row */}
        {times.length > 0 ? (
          <View style={styles.timingsRow}>
            {times.map((t) => (
              <View key={t} style={styles.timeChip}>
                <Text style={styles.timeChipText}>🍽 {t}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noTime}>No timing specified</Text>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Taken button */}
        <TouchableOpacity
          style={[styles.takenBtn, loading && styles.takenBtnDisabled]}
          onPress={handleTaken}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Text style={styles.takenBtnText}>
            {loading ? "Updating..." : "✅  Mark as Taken"}
          </Text>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

// ─── Today Screen ─────────────────────────────────────────────────────────────

export default function Today() {
  const [medicines,   setMedicines]   = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);

  const todayKey   = DAYS[new Date().getDay()]; // e.g. "MONDAY"
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  // ── progress tracking
  const [totalCount, setTotalCount] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const savedId = await AsyncStorage.getItem("userId");
          if (!savedId) { router.replace("/login"); return; }
          setUserId(savedId);
          await fetchAll(savedId);
        } catch (e) {
          console.log("Init error:", e);
          setLoading(false);
        }
      };
      init();
    }, [])
  );

  const fetchAll = async (id) => {
    setLoading(true);
    try {
      const medRes    = await axios.get(`${api}/medicine/${id}`);
      const meds      = medRes.data || [];

      const schRes    = await axios.get(`${api}/schedule/user/${id}`);
      const schedules = schRes.data || [];

      // build scheduleMap
      const map = {};
      schedules.forEach((s) => { map[s.medicineId] = s; });
      setScheduleMap(map);

      // ✅ filter — today's day + startDate must be <= today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayMeds = meds.filter((m) => {
        const sch = map[m.id];
        if (!sch || !sch.days) return false;

        // startDate check — "2026-03-20" format
        const startDate = new Date(m.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate > today) return false; // future medicine — skip

        // day check
        return sch.days.includes(todayKey);
      });

      setMedicines(todayMeds);
      setTotalCount(todayMeds.length);

      // animate progress bar to full (no medicines taken yet on load)
      Animated.timing(progressAnim, {
        toValue: todayMeds.length > 0 ? 1 : 0,
        duration: 800,
        useNativeDriver: false,
      }).start();

    } catch (error) {
      if (error.response?.status === 404) {
        setMedicines([]);
        setScheduleMap({});
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaken = async (item) => {
    try {
      const newQty = item.quantity - 1;

      await axios.put(`${api}/medicine/update/${item.id}`, {
        ...item,
        quantity: newQty,
      });

      const updated = medicines.filter((m) => m.id !== item.id);
      setMedicines(updated);

      // animate progress bar — shrink as medicines get taken
      const remaining = updated.length;
      Animated.spring(progressAnim, {
        toValue: totalCount > 0 ? remaining / totalCount : 0,
        tension: 40,
        friction: 7,
        useNativeDriver: false,
      }).start();

    } catch (error) {
      console.log("Taken error:", error);
      Alert.alert("Error", "Could not update. Please try again.");
    }
  };

  // ── progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0%", "100%"],
  });

  const takenCount = totalCount - medicines.length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>

        {/* back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* title block */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Today's Dose 💊</Text>
          <Text style={styles.headerDate}>{todayLabel}</Text>
        </View>

        {/* spacer */}
        <View style={{ width: 60 }} />
      </View>

      {/* ── Progress Section ── */}
      {!loading && totalCount > 0 && (
        <View style={styles.progressSection}>

          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {takenCount === totalCount
                ? "🎉 All medicines taken!"
                : `${takenCount} of ${totalCount} taken`}
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round((takenCount / totalCount) * 100)}%
            </Text>
          </View>

          {/* progress bar track */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
                takenCount === totalCount && styles.progressFillDone,
              ]}
            />
          </View>

          {/* chips row */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipNum}>{medicines.length}</Text>
              <Text style={styles.statChipLabel}>Remaining</Text>
            </View>
            <View style={[styles.statChip, styles.statChipGreen]}>
              <Text style={[styles.statChipNum, styles.statChipNumGreen]}>{takenCount}</Text>
              <Text style={[styles.statChipLabel, styles.statChipLabelGreen]}>Taken</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipNum}>{totalCount}</Text>
              <Text style={styles.statChipLabel}>Total</Text>
            </View>
          </View>

        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Fetching your medicines...</Text>
        </View>

      ) : medicines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>You're all done!</Text>
          <Text style={styles.doneSub}>
            All medicines for today have been taken.{"\n"}Stay healthy! 💪
          </Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeBtnText}>← Go Back Home</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TodayCard
              item={item}
              schedule={scheduleMap[item.id] || null}
              onTaken={handleTaken}
              index={index}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE   = "#2E86DE";
const GREEN  = "#27AE60";
const RED    = "#E74C3C";

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#F4F7FB" },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BLUE,
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  backBtn:      { width: 60 },
  backText:     { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600" },
  headerCenter: { alignItems: "center" },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  headerDate:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 },

  // ── Progress Section
  progressSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel:   { fontSize: 13, fontWeight: "700", color: "#333" },
  progressPercent: { fontSize: 13, fontWeight: "800", color: BLUE },

  progressTrack: {
    height: 8,
    backgroundColor: "#EEF4FF",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BLUE,
    borderRadius: 99,
  },
  progressFillDone: {
    backgroundColor: GREEN,
  },

  statsRow:  { flexDirection: "row", gap: 10 },
  statChip:  {
    flex: 1,
    backgroundColor: "#F4F7FB",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  statChipGreen:       { backgroundColor: "#EAFAF1" },
  statChipNum:         { fontSize: 18, fontWeight: "800", color: "#1a1a2e" },
  statChipNumGreen:    { color: GREEN },
  statChipLabel:       { fontSize: 11, color: "#999", marginTop: 2, fontWeight: "600" },
  statChipLabelGreen:  { color: GREEN },

  // ── List
  list:   { padding: 16, paddingTop: 14, paddingBottom: 40 },

  // ── Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLow: {
    backgroundColor: "#FFF8F8",
    shadowColor: RED,
    borderWidth: 1,
    borderColor: "#FFD5D5",
  },

  accentBar:    { width: 5, backgroundColor: BLUE },
  accentBarLow: { backgroundColor: RED },

  cardContent: { flex: 1, padding: 16, gap: 10 },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dot:     { width: 9, height: 9, borderRadius: 99, backgroundColor: BLUE },
  dotLow:  { backgroundColor: RED },

  medicineName: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", flex: 1 },

  qtyBadge: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  qtyBadgeLow: { backgroundColor: "#FFE8E8" },
  qtyText:     { fontSize: 12, fontWeight: "700", color: BLUE },
  qtyTextLow:  { color: RED },

  timingsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip:   {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeChipText: { fontSize: 12, color: "#E67E22", fontWeight: "600" },
  noTime:       { fontSize: 12, color: "#bbb", fontStyle: "italic" },

  divider: {
    height: 1,
    backgroundColor: "#F0F4FF",
    marginVertical: 2,
  },

  takenBtn: {
    backgroundColor: "#EEF9F2",
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: GREEN,
  },
  takenBtnDisabled: { opacity: 0.5 },
  takenBtnText:     { color: GREEN, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 },

  // ── Loading / Empty
  center:      { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 60 },
  loadingText: { marginTop: 14, color: "#aaa", fontSize: 14 },

  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 24, fontWeight: "800", color: "#1a1a2e", marginBottom: 8 },
  doneSub:   {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  backHomeBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  backHomeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});