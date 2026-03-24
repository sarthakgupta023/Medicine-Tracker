import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Animated,
  FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../private";

const DAYS     = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const todayDate = new Date().toISOString().split("T")[0];

// ─── TimingButton ─────────────────────────────────────────────────────────────

function TimingButton({ timing, onPress, quantity }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => { setLoading(true); await onPress(timing); setLoading(false); };

  if (quantity <= 0) {
    return (
      <View style={styles.outOfStockChip}>
        <Text style={styles.outOfStockText}>🚫  Out of stock — {timing}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.takenBtn, loading && styles.takenBtnDisabled]}
      onPress={handle} disabled={loading} activeOpacity={0.75}
    >
      <View style={styles.takenBtnInner}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>{loading ? "…" : "✓"}</Text>
        </View>
        <Text style={styles.takenBtnText}>
          {loading ? "Updating..." : `Taken — 🍽 ${timing}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── TodayCard ────────────────────────────────────────────────────────────────

function TodayCard({ item, allTimes, remainingTimes, onTaken, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay: index * 80, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start();
  });

  const animateOut = (cb) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 250, useNativeDriver: true }),
    ]).start(cb);
  };

  const isLow      = item.quantity < 5;
  const takenCount = allTimes.length - remainingTimes.length;

  return (
    <Animated.View style={[styles.card, isLow && styles.cardLow, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.accentBar, isLow && styles.accentBarLow]} />
      <View style={styles.cardContent}>

        {/* Top row */}
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

        {/* Progress dots */}
        {allTimes.length > 1 && (
          <View style={styles.timingProgressRow}>
            <Text style={styles.timingProgressText}>{takenCount}/{allTimes.length} timings taken</Text>
            <View style={styles.timingDots}>
              {allTimes.map((t) => (
                <View key={t} style={[styles.timingDot, !remainingTimes.includes(t) && styles.timingDotDone]} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.timingBtnsCol}>
          {remainingTimes.map((t) => (
            <TimingButton
              key={t} timing={t} quantity={item.quantity}
              onPress={(timing) => {
                if (remainingTimes.length === 1) animateOut(() => onTaken(item, timing));
                else onTaken(item, timing);
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Today Screen ─────────────────────────────────────────────────────────────

export default function Today() {
  const [medicines,   setMedicines]   = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [takenMap,    setTakenMap]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [totalCount,  setTotalCount]  = useState(0);

  const todayKey   = DAYS[new Date().getDay()];
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

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
      const map = {};
      schedules.forEach((s) => { map[s.medicineId] = s; });
      setScheduleMap(map);

      let builtTakenMap = {};
      try {
        const logRes = await axios.get(`${api}/logs/${id}/${todayDate}`);
        (logRes.data || []).forEach((l) => {
          if (!builtTakenMap[l.medicineId]) builtTakenMap[l.medicineId] = new Set();
          builtTakenMap[l.medicineId].add(l.timing);
        });
      } catch {}
      setTakenMap(builtTakenMap);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayMeds = meds.filter((m) => {
        const sch = map[m.id];
        if (!sch?.days) return false;
        const startDate = new Date(m.startDate); startDate.setHours(0, 0, 0, 0);
        if (startDate > today) return false;
        if (!sch.days.includes(todayKey)) return false;
        const remaining = (sch.times || []).filter((t) => !builtTakenMap[m.id]?.has(t));
        return remaining.length > 0;
      });

      setMedicines(todayMeds);
      setTotalCount(todayMeds.length);
      Animated.timing(progressAnim, { toValue: todayMeds.length > 0 ? 1 : 0, duration: 800, useNativeDriver: false }).start();
    } catch (error) {
      if (error.response?.status === 404) { setMedicines([]); setScheduleMap({}); setTotalCount(0); }
    } finally {
      setLoading(false);
    }
  };

  const handleTaken = async (item, timing) => {
    try {
      const newQty = item.quantity - 1;
      await axios.put(`${api}/medicine/update/${item.id}`, { ...item, quantity: newQty });
      await axios.post(`${api}/logs/taken`, { userId, medicineId: item.id, takenDate: todayDate, timing });

      const updatedTakenMap = { ...takenMap };
      if (!updatedTakenMap[item.id]) updatedTakenMap[item.id] = new Set();
      updatedTakenMap[item.id] = new Set([...updatedTakenMap[item.id], timing]);
      setTakenMap(updatedTakenMap);
      setMedicines((prev) => prev.map((m) => m.id === item.id ? { ...m, quantity: newQty } : m));

      const allTimings = scheduleMap[item.id]?.times || [];
      const remaining  = allTimings.filter((t) => !updatedTakenMap[item.id].has(t));
      if (remaining.length === 0) {
        setMedicines((prev) => prev.filter((m) => m.id !== item.id));
        Animated.spring(progressAnim, {
          toValue: totalCount > 0 ? (medicines.length - 1) / totalCount : 0,
          tension: 40, friction: 7, useNativeDriver: false,
        }).start();
      }
    } catch {
      Alert.alert("Error", "Could not update. Please try again.");
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const takenCount    = totalCount - medicines.length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTR]} />
      <View style={[styles.blob, styles.blobBL]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Today's Dose 💊</Text>
            <Text style={styles.headerDate}>{todayLabel}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Section */}
        {!loading && totalCount > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {takenCount === totalCount ? "🎉 All done!" : `${takenCount} of ${totalCount} taken`}
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round((takenCount / totalCount) * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }, takenCount === totalCount && styles.progressFillDone]} />
            </View>
            <View style={styles.statsRow}>
              {[
                { num: medicines.length, label: "Remaining", green: false },
                { num: takenCount,       label: "Taken",     green: true  },
                { num: totalCount,       label: "Total",     green: false },
              ].map(({ num, label, green }) => (
                <View key={label} style={[styles.statChip, green && styles.statChipGreen]}>
                  <Text style={[styles.statChipNum, green && styles.statChipNumGreen]}>{num}</Text>
                  <Text style={[styles.statChipLabel, green && styles.statChipLabelGreen]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.loadingText}>Fetching your medicines...</Text>
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.doneCircle}>
              <Text style={styles.doneEmoji}>🎉</Text>
            </View>
            <Text style={styles.doneTitle}>You're all done!</Text>
            <Text style={styles.doneSub}>All medicines taken.{"\n"}Stay healthy! 💪</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <LinearGradient colors={["#4A90D9","#2D6BB5"]} style={styles.backHomeBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.backHomeBtnText}>← Go Back Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const allTimes       = scheduleMap[item.id]?.times || [];
              const takenTimings   = takenMap[item.id] || new Set();
              const remainingTimes = allTimes.filter((t) => !takenTimings.has(t));
              return (
                <TodayCard
                  item={item} allTimes={allTimes}
                  remainingTimes={remainingTimes}
                  onTaken={handleTaken} index={index}
                />
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  blob:      { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blobTR:    { width: 280, height: 280, backgroundColor: "#4A90D9", top: -60, right: -80 },
  blobBL:    { width: 200, height: 200, backgroundColor: "#27AE60", bottom: 60, left: -60 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  backArrow:    { fontSize: 20, color: "#fff" },
  headerCenter: { alignItems: "center" },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  headerDate:   { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 },

  progressSection: {
    marginHorizontal: 18, marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel:   { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  progressPercent: { fontSize: 13, fontWeight: "800", color: "#4A90D9" },
  progressTrack:   { height: 8, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 16 },
  progressFill:    { height: "100%", backgroundColor: "#4A90D9", borderRadius: 99 },
  progressFillDone:{ backgroundColor: "#27AE60" },

  statsRow: { flexDirection: "row", gap: 10 },
  statChip: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14, paddingVertical: 10, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  statChipGreen:      { backgroundColor: "rgba(39,174,96,0.15)", borderColor: "rgba(39,174,96,0.25)" },
  statChipNum:        { fontSize: 18, fontWeight: "800", color: "#fff" },
  statChipNumGreen:   { color: "#27AE60" },
  statChipLabel:      { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, fontWeight: "600" },
  statChipLabelGreen: { color: "#27AE60" },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20, marginBottom: 12,
    flexDirection: "row", overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  cardLow:      { backgroundColor: "rgba(231,76,60,0.1)", borderColor: "rgba(231,76,60,0.25)" },
  accentBar:    { width: 4, backgroundColor: "#4A90D9" },
  accentBarLow: { backgroundColor: "#E74C3C" },
  cardContent:  { flex: 1, padding: 14, gap: 10 },

  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameRow:    { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dot:        { width: 9, height: 9, borderRadius: 99, backgroundColor: "#4A90D9" },
  dotLow:     { backgroundColor: "#E74C3C" },
  medicineName: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1 },

  qtyBadge:    { backgroundColor: "rgba(74,144,217,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: "rgba(74,144,217,0.3)" },
  qtyBadgeLow: { backgroundColor: "rgba(231,76,60,0.2)", borderColor: "rgba(231,76,60,0.3)" },
  qtyText:     { fontSize: 12, fontWeight: "700", color: "#4A90D9" },
  qtyTextLow:  { color: "#E74C3C" },

  timingProgressRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timingProgressText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  timingDots:         { flexDirection: "row", gap: 5 },
  timingDot:          { width: 10, height: 10, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.12)" },
  timingDotDone:      { backgroundColor: "#27AE60" },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  timingBtnsCol: { gap: 8 },
  takenBtn: {
    backgroundColor: "rgba(39,174,96,0.12)",
    paddingVertical: 11, borderRadius: 14,
    borderWidth: 1.5, borderColor: "rgba(39,174,96,0.3)",
  },
  takenBtnDisabled: { opacity: 0.5 },
  takenBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(39,174,96,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(39,174,96,0.4)",
  },
  checkText:    { color: "#27AE60", fontWeight: "800", fontSize: 12 },
  takenBtnText: { color: "#27AE60", fontWeight: "800", fontSize: 13 },

  outOfStockChip: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 11, borderRadius: 14,
    alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)",
  },
  outOfStockText: { color: "rgba(255,255,255,0.2)", fontWeight: "700", fontSize: 13 },

  center:      { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 60 },
  loadingText: { marginTop: 14, color: "rgba(255,255,255,0.35)", fontSize: 14 },
  doneCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(39,174,96,0.15)",
    borderWidth: 1.5, borderColor: "rgba(39,174,96,0.3)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  doneEmoji:   { fontSize: 48 },
  doneTitle:   { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 8 },
  doneSub:     { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  backHomeBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16,
    shadowColor: "#4A90D9", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  backHomeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});