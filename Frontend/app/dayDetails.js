import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../private";

const DAY_KEYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { SUNDAY:"SUN",MONDAY:"MON",TUESDAY:"TUE",WEDNESDAY:"WED",THURSDAY:"THU",FRIDAY:"FRI",SATURDAY:"SAT" };

function parseYmdToLocalDate(ymd) {
  if (!ymd || typeof ymd !== "string") return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function DayDetails() {
  const { date }         = useLocalSearchParams();
  const selectedDate     = Array.isArray(date) ? date[0] : date;

  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id && selectedDate) fetchData(id, selectedDate);
    };
    init();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [selectedDate]);

  const fetchData = async (id, targetDate) => {
    try {
      setLoading(true);
      const selectedDateObj = parseYmdToLocalDate(targetDate);
      if (!selectedDateObj) { setData([]); return; }
      selectedDateObj.setHours(0, 0, 0, 0);
      const selectedDayFull  = DAY_KEYS[selectedDateObj.getDay()];
      const selectedDayShort = DAY_SHORT[selectedDayFull];

      const medRes = await axios.get(`${api}/medicine/${id}`);
      const meds   = medRes.data || [];
      const schRes = await axios.get(`${api}/schedule/user/${id}`);
      const map    = {};
      (schRes.data || []).forEach((s) => { map[s.medicineId] = s; });

      let takenMap = {};
      try {
        const logRes = await axios.get(`${api}/logs/${id}/${targetDate}`);
        (logRes.data || []).forEach((l) => {
          if (!takenMap[l.medicineId]) takenMap[l.medicineId] = [];
          takenMap[l.medicineId].push(l.timing);
        });
      } catch {}

      const result = [];
      meds.forEach((m) => {
        const sch = map[m.id];
        if (!sch) return;
        if (!sch.days?.includes(selectedDayFull)) return;
        const startDate = parseYmdToLocalDate(m.startDate);
        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          if (startDate > selectedDateObj) return;
        }
        const allTimes = sch.dayTimesMap?.[selectedDayShort]?.length > 0
          ? sch.dayTimesMap[selectedDayShort] : sch.times || [];
        const taken = takenMap[m.id] || [];
        allTimes.forEach((t) => {
          result.push({ name: m.name, timing: t, status: taken.includes(t) ? "Taken" : "Missed" });
        });
      });
      setData(result);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // Format date nicely
  const parsed = parseYmdToLocalDate(selectedDate);
  const dateLabel = parsed
    ? parsed.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : selectedDate;

  const takenCount  = data.filter((d) => d.status === "Taken").length;
  const missedCount = data.filter((d) => d.status === "Missed").length;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTR]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>📅 Daily Log</Text>
            <Text style={styles.headerDate} numberOfLines={1}>{dateLabel}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary chips */}
        {!loading && data.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, styles.summaryChipGreen]}>
              <Text style={[styles.summaryNum, { color: "#27AE60" }]}>{takenCount}</Text>
              <Text style={[styles.summaryLabel, { color: "#27AE60" }]}>Taken</Text>
            </View>
            <View style={[styles.summaryChip, styles.summaryChipRed]}>
              <Text style={[styles.summaryNum, { color: "#E74C3C" }]}>{missedCount}</Text>
              <Text style={[styles.summaryLabel, { color: "#E74C3C" }]}>Missed</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryNum}>{data.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>
        )}

        <Animated.FlatList
          data={data}
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.listContent}
          keyExtractor={(_, i) => i.toString()}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>📭</Text>
                </View>
                <Text style={styles.emptyTitle}>No records</Text>
                <Text style={styles.emptyText}>No medicine activity on this date.</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <Animated.View
              style={[styles.card, {
                opacity: fadeAnim,
                transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              }]}
            >
              <View style={[styles.statusAccent, item.status === "Taken" ? styles.accentGreen : styles.accentRed]} />
              <View style={styles.cardBody}>
                <Text style={styles.medicineName}>{item.name}</Text>
                <Text style={styles.timingText}>🍽 {item.timing}</Text>
                <View style={[styles.statusChip, item.status === "Taken" ? styles.greenBg : styles.redBg]}>
                  <Text style={[styles.statusText, item.status === "Taken" ? styles.greenText : styles.redText]}>
                    {item.status === "Taken" ? "✓  Taken" : "✗  Missed"}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blobTR: { width: 260, height: 260, backgroundColor: "#4A90D9", top: -60, right: -70 },

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
  headerCenter: { alignItems: "center", flex: 1, paddingHorizontal: 10 },
  headerTitle:  { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerDate:   { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3, textAlign: "center" },

  summaryRow: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 18, marginBottom: 12,
  },
  summaryChip: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  summaryChipGreen: { backgroundColor: "rgba(39,174,96,0.12)",  borderColor: "rgba(39,174,96,0.25)"  },
  summaryChipRed:   { backgroundColor: "rgba(231,76,60,0.12)",  borderColor: "rgba(231,76,60,0.25)"  },
  summaryNum:   { fontSize: 20, fontWeight: "800", color: "#fff" },
  summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: 2 },

  listContent: { paddingHorizontal: 18, paddingBottom: 30 },

  emptyWrap: { alignItems: "center", marginTop: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyIcon:  { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  emptyText:  { fontSize: 14, color: "rgba(255,255,255,0.3)" },

  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16, marginBottom: 10,
    flexDirection: "row", overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  statusAccent: { width: 4 },
  accentGreen:  { backgroundColor: "#27AE60" },
  accentRed:    { backgroundColor: "#E74C3C" },
  cardBody:     { flex: 1, padding: 14, gap: 4 },

  medicineName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  timingText:   { fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: "500" },

  statusChip: {
    marginTop: 6, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, alignSelf: "flex-start", borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: "800" },
  greenBg:    { backgroundColor: "rgba(39,174,96,0.15)",  borderColor: "rgba(39,174,96,0.35)"  },
  redBg:      { backgroundColor: "rgba(231,76,60,0.15)",  borderColor: "rgba(231,76,60,0.35)"  },
  greenText:  { color: "#27AE60" },
  redText:    { color: "#E74C3C" },
});