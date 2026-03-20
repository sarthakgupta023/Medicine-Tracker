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

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_SHORT = {
  MONDAY:    "Mon",
  TUESDAY:   "Tue",
  WEDNESDAY: "Wed",
  THURSDAY:  "Thu",
  FRIDAY:    "Fri",
  SATURDAY:  "Sat",
  SUNDAY:    "Sun",
};

// ─── MedicineCard ─────────────────────────────────────────────────────────────

function MedicineCard({ item, schedule, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const scheduleDays  = schedule ? (schedule.days  || []).map((d) => DAY_SHORT[d] || d) : [];
  const scheduleTimes = schedule ? (schedule.times || []) : [];

  const expandHeight = 220
    + (scheduleDays.length  > 0 ? 70  : 30)
    + (scheduleTimes.length > 0 ? scheduleTimes.length * 44 : 30);
    
  const cardHeight = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [72, expandHeight],
  });

  const arrowRotate = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Medicine",
      `Are you sure you want to delete "${item.name}"?\nThis will also remove its schedule.`,
      [
        { text: "Cancel",  style: "cancel" },
        { text: "Delete",  style: "destructive", onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <Animated.View style={[styles.card, { height: cardHeight, overflow: "hidden" }]}>

      {/* Header */}
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.cardLeft}>
          <View style={[styles.pillDot, !item.active && styles.pillDotInactive]} />
          <View>
            <Text style={styles.medicineName}>{item.name}</Text>
            {!item.active && <Text style={styles.inactiveLabel}>Completed</Text>}
          </View>
        </View>
        <Animated.Text style={[styles.arrow, { transform: [{ rotate: arrowRotate }] }]}>
          ▼
        </Animated.Text>
      </TouchableOpacity>

      {/* Expanded Body */}
      <View style={styles.cardBody}>

        {/* Quantity */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💊 Remaining</Text>
          <View style={[styles.badge, item.quantity < 5 && styles.badgeLow]}>
            <Text style={[styles.badgeText, item.quantity < 5 && styles.badgeTextLow]}>
              {item.quantity} tablets{item.quantity < 5 ? "  ⚠️" : ""}
            </Text>
          </View>
        </View>

        {/* Days */}
        <Text style={styles.detailLabel}>📅 Schedule</Text>
        {scheduleDays.length > 0 ? (
          <View style={styles.daysRow}>
            {ALL_DAYS.map((d) => (
              <View
                key={d}
                style={[styles.dayChip, scheduleDays.includes(d) && styles.dayChipActive]}
              >
                <Text style={[styles.dayText, scheduleDays.includes(d) && styles.dayTextActive]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No schedule set</Text>
        )}

        {/* Timings */}
        <Text style={styles.detailLabel}>🍽 Timings</Text>
        {scheduleTimes.length > 0 ? (
          <View style={styles.timingsCol}>
            {scheduleTimes.map((t) => (
              <View key={t} style={styles.mealChip}>
                <Text style={styles.mealText}>• {t}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No timings set</Text>
        )}

        {/* Edit + Delete */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/addMedicine",
              params: {
                editMode:    "true",
                medicineId:  item.id,
                userId:      item.userId,
                name:        item.name,
                quantity:    String(item.quantity),
                startDate:   item.startDate,
                days:        JSON.stringify(schedule?.days        || []),
                times:       JSON.stringify(schedule?.times       || []),
                dayTimesMap: JSON.stringify(schedule?.dayTimesMap || {}),
              },
            })}
          >
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={handleDelete}
          >
            <Text style={styles.deleteBtnText}>🗑️  Delete</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Animated.View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function Home() {

  const [userId,      setUserId]      = useState(null);
  const [email,       setEmail]       = useState("");
  const [medicines,   setMedicines]   = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading,     setLoading]     = useState(true);

  // ✅ useFocusEffect — runs every time screen comes into focus
  // this means after edit or add, home auto refreshes
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const savedUserId = await AsyncStorage.getItem("userId");
          const savedEmail  = await AsyncStorage.getItem("userEmail") || "";

          // ✅ auth guard — if no userId redirect to login
          if (!savedUserId) {
            router.replace("/login");
            return;
          }

          setUserId(savedUserId);
          setEmail(savedEmail);
          await fetchAll(savedUserId);

        } catch (e) {
          console.log("Init error:", e);
          setLoading(false);
        }
      };

      init();
    }, [])   // empty deps — runs every focus
  );

  const fetchAll = async (id) => {
    setLoading(true);
    try {
      // 1 — fetch medicines
      const medRes = await axios.get(`${api}/medicine/${id}`);
      const meds   = medRes.data || [];
      setMedicines(meds);

      // 2 — fetch schedules
      const schRes    = await axios.get(`${api}/schedule/user/${id}`);
      const schedules = schRes.data || [];

      // 3 — build map { medicineId → schedule }
      const map = {};
      schedules.forEach((s) => { map[s.medicineId] = s; });
      setScheduleMap(map);

    } catch (error) {
      console.log("Fetch error:", error);
      // 404 just means empty — not a real error
      if (error.response?.status === 404) {
        setMedicines([]);
        setScheduleMap({});
      }
    } finally {
      setLoading(false);
    }
  };

  // ── delete medicine + schedule
  const handleDelete = async (medicineId) => {
    try {
      await axios.delete(`${api}/schedule/delete/${medicineId}`);
      await axios.delete(`${api}/medicine/delete/${medicineId}`);

      // remove from state instantly
      setMedicines((prev) => prev.filter((m) => m.id !== medicineId));
      setScheduleMap((prev) => {
        const updated = { ...prev };
        delete updated[medicineId];
        return updated;
      });

      Alert.alert("Deleted", "Medicine removed successfully.");

    } catch (error) {
      console.log("Delete error:", error);
      Alert.alert("Error", "Failed to delete medicine. Please try again.");
    }
  };

  const handleRefresh = () => {
    if (userId) fetchAll(userId);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>My Medicines 💊</Text>
          <Text style={styles.sub}>{email || "your dashboard"}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E86DE" />
          <Text style={styles.loadingText}>Loading medicines...</Text>
        </View>

      ) : medicines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🗂️</Text>
          <Text style={styles.emptyTitle}>No Medicines Added</Text>
          <Text style={styles.emptySubtitle}>
            Your medicine list is empty.{"\n"}Tap the button below to add one.
          </Text>
        </View>

      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicineCard
              item={item}
              schedule={scheduleMap[item.id] || null}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={loading}
        />
      )}

      {/* Add Medicine Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push({ pathname: "/addMedicine", params: { userId } })}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>＋  Add Medicine</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = "#2E86DE";

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#F4F7FB" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BLUE,
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting:  { fontSize: 22, fontWeight: "700", color: "#fff" },
  sub:       { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  center:        { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 100 },
  emptyIcon:     { fontSize: 64, marginBottom: 16 },
  emptyTitle:    { fontSize: 20, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 },
  loadingText:   { marginTop: 12, color: "#888", fontSize: 14 },

  list: { padding: 16, paddingBottom: 110 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    height: 72,
  },
  cardLeft:        { flexDirection: "row", alignItems: "center", gap: 10 },
  pillDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  pillDotInactive: { backgroundColor: "#ccc" },
  medicineName:    { fontSize: 17, fontWeight: "600", color: "#1a1a2e" },
  inactiveLabel:   { fontSize: 11, color: "#aaa", marginTop: 1 },
  arrow:           { fontSize: 13, color: BLUE },

  cardBody:    { paddingHorizontal: 18, paddingBottom: 16, gap: 6 },
  detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4, marginTop: 6 },
  noData:      { fontSize: 12, color: "#bbb", marginBottom: 4 },

  badge:        { backgroundColor: "#E8F4FF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeLow:     { backgroundColor: "#FFE8E8" },
  badgeText:    { fontSize: 13, fontWeight: "600", color: BLUE },
  badgeTextLow: { color: "#E74C3C" },

  daysRow:       { flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 2 },
  dayChip:       { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: "#F0F0F0" },
  dayChipActive: { backgroundColor: BLUE },
  dayText:       { fontSize: 11, color: "#999", fontWeight: "500" },
  dayTextActive: { color: "#fff", fontWeight: "700" },

  timingsCol: { gap: 6 },
  mealChip:   { backgroundColor: "#FFF3E0", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  mealText:   { fontSize: 13, color: "#E67E22", fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  editBtn: {
    flex: 1, backgroundColor: "#E8F4FF",
    paddingVertical: 10, borderRadius: 12,
    alignItems: "center", borderWidth: 1, borderColor: BLUE,
  },
  editBtnText:  { color: BLUE, fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    flex: 1, backgroundColor: "#FFE8E8",
    paddingVertical: 10, borderRadius: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#E74C3C",
  },
  deleteBtnText: { color: "#E74C3C", fontWeight: "700", fontSize: 13 },

  addButton: {
    position: "absolute",
    bottom: 28, left: 24, right: 24,
    backgroundColor: BLUE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});