import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../private";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_SHORT = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

// ─── MedicineCard ─────────────────────────────────────────────────────────────

function MedicineCard({ item, schedule, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, { toValue: expanded ? 0 : 1, duration: 280, useNativeDriver: false }).start();
    setExpanded(!expanded);
  };

  const scheduleDays  = schedule ? (schedule.days  || []).map((d) => DAY_SHORT[d] || d) : [];
  const scheduleTimes = schedule ? (schedule.times || []) : [];

  const expandHeight = 220
    + (scheduleDays.length  > 0 ? 70  : 30)
    + (scheduleTimes.length > 0 ? scheduleTimes.length * 44 : 30);

  const cardHeight   = anim.interpolate({ inputRange: [0, 1], outputRange: [76, expandHeight] });
  const arrowRotate  = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  const isLow = item.quantity < 5;

  const handleDelete = () => {
    Alert.alert(
      "Delete Medicine",
      `Remove "${item.name}"? This will also delete its schedule.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <Animated.View style={[styles.card, isLow && styles.cardLow, { height: cardHeight, overflow: "hidden" }]}>
      {/* Accent bar */}
      <View style={[styles.accentBar, isLow && styles.accentBarLow]} />

      {/* Header */}
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.cardLeft}>
          <View style={[styles.pillDot, !item.active && styles.pillDotInactive, isLow && styles.pillDotLow]} />
          <View>
            <Text style={styles.medicineName}>{item.name}</Text>
            {!item.active && <Text style={styles.inactiveLabel}>Completed</Text>}
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {isLow && <View style={styles.warningBadge}><Text style={styles.warningBadgeText}>Low</Text></View>}
          <Animated.Text style={[styles.arrow, { transform: [{ rotate: arrowRotate }] }]}>▼</Animated.Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Body */}
      <View style={styles.cardBody}>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💊 Remaining</Text>
          <View style={[styles.badge, isLow && styles.badgeLow]}>
            <Text style={[styles.badgeText, isLow && styles.badgeTextLow]}>
              {item.quantity} tablets{isLow ? " ⚠️" : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.detailLabel}>📅 Schedule</Text>
        {scheduleDays.length > 0 ? (
          <View style={styles.daysRow}>
            {ALL_DAYS.map((d) => (
              <View key={d} style={[styles.dayChip, scheduleDays.includes(d) && styles.dayChipActive]}>
                <Text style={[styles.dayText, scheduleDays.includes(d) && styles.dayTextActive]}>{d}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={styles.noData}>No schedule set</Text>}

        <Text style={styles.detailLabel}>🍽 Timings</Text>
        {scheduleTimes.length > 0 ? (
          <View style={styles.timingsCol}>
            {scheduleTimes.map((t) => (
              <View key={t} style={styles.mealChip}>
                <Text style={styles.mealText}>• {t}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={styles.noData}>No timings set</Text>}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: "/addMedicine",
              params: {
                editMode: "true", medicineId: item.id, userId: item.userId,
                name: item.name, quantity: String(item.quantity), startDate: item.startDate,
                days: JSON.stringify(schedule?.days || []),
                times: JSON.stringify(schedule?.times || []),
                dayTimesMap: JSON.stringify(schedule?.dayTimesMap || {}),
              },
            })}
          >
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.8} onPress={handleDelete}>
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

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          const savedUserId = await AsyncStorage.getItem("userId");
          const savedEmail  = await AsyncStorage.getItem("userEmail") || "";
          if (!savedUserId) { router.replace("/login"); return; }
          setUserId(savedUserId);
          setEmail(savedEmail);
          await fetchAll(savedUserId);
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
      setMedicines(meds);
      const schRes    = await axios.get(`${api}/schedule/user/${id}`);
      const schedules = schRes.data || [];
      const map = {};
      schedules.forEach((s) => { map[s.medicineId] = s; });
      setScheduleMap(map);
    } catch (error) {
      if (error.response?.status === 404) { setMedicines([]); setScheduleMap({}); }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicineId) => {
    try {
      await axios.delete(`${api}/schedule/delete/${medicineId}`);
      await axios.delete(`${api}/medicine/delete/${medicineId}`);
      setMedicines((prev) => prev.filter((m) => m.id !== medicineId));
      setScheduleMap((prev) => { const u = { ...prev }; delete u[medicineId]; return u; });
      Alert.alert("Deleted", "Medicine removed successfully.");
    } catch {
      Alert.alert("Error", "Failed to delete medicine. Please try again.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  const firstName = email.split("@")[0] || "there";

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTR]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>

        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.sub}>
              {medicines.length > 0
                ? `${medicines.length} medicine${medicines.length > 1 ? "s" : ""} tracked`
                : "No medicines yet"}
            </Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.push("/calender")} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>📆</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: "/today", params: { userId } })} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, styles.logoutBtn]}>
              <Text style={styles.iconBtnText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Pills */}
        <View style={styles.navPills}>
          <TouchableOpacity onPress={() => router.push("/calender")} style={styles.navPill}>
            <Text style={styles.navPillText}>📆 Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: "/today", params: { userId } })} style={[styles.navPill, styles.navPillPrimary]}>
            <Text style={[styles.navPillText, styles.navPillTextPrimary]}>📅 Today's Dose</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.loadingText}>Loading medicines...</Text>
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🗂️</Text>
            </View>
            <Text style={styles.emptyTitle}>No Medicines Added</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button below to{"\n"}add your first medicine.
            </Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MedicineCard item={item} schedule={scheduleMap[item.id] || null} onDelete={handleDelete} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={() => userId && fetchAll(userId)}
            refreshing={loading}
          />
        )}
      </SafeAreaView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push({ pathname: "/addMedicine", params: { userId } })}
        activeOpacity={0.85}
      >
        <LinearGradient colors={["#4A90D9", "#2D6BB5"]} style={styles.addButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.addButtonText}>＋  Add Medicine</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blobTR: { width: 300, height: 300, backgroundColor: "#4A90D9", top: -60, right: -80 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  sub:       { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 },

  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  logoutBtn: { backgroundColor: "rgba(231,76,60,0.2)", borderColor: "rgba(231,76,60,0.3)" },
  iconBtnText: { fontSize: 16 },

  navPills: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  navPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navPillPrimary: {
    backgroundColor: "rgba(74,144,217,0.2)",
    borderColor: "rgba(74,144,217,0.4)",
  },
  navPillText:        { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  navPillTextPrimary: { color: "#4A90D9" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 100 },
  emptyIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(74,144,217,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  emptyIcon:     { fontSize: 44 },
  emptyTitle:    { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 22 },
  loadingText:   { marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 14 },

  list: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },

  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    overflow: "hidden",
  },
  cardLow: {
    backgroundColor: "rgba(231,76,60,0.1)",
    borderColor: "rgba(231,76,60,0.3)",
  },
  accentBar:    { width: 4, backgroundColor: "#4A90D9" },
  accentBarLow: { backgroundColor: "#E74C3C" },

  cardHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    height: 76,
  },
  cardLeft:        { flexDirection: "row", alignItems: "center", gap: 10 },
  pillDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4A90D9" },
  pillDotInactive: { backgroundColor: "rgba(255,255,255,0.2)" },
  pillDotLow:      { backgroundColor: "#E74C3C" },
  medicineName:    { fontSize: 16, fontWeight: "700", color: "#fff" },
  inactiveLabel:   { fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  warningBadge: {
    backgroundColor: "rgba(231,76,60,0.2)",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: "rgba(231,76,60,0.4)",
  },
  warningBadgeText: { color: "#E74C3C", fontSize: 10, fontWeight: "700" },
  arrow: { fontSize: 11, color: "rgba(255,255,255,0.4)" },

  cardBody: { flex: 1, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 4 },

  detailRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.45)", marginBottom: 4, marginTop: 6 },
  noData:      { fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: 4 },

  badge:        { backgroundColor: "rgba(74,144,217,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "rgba(74,144,217,0.3)" },
  badgeLow:     { backgroundColor: "rgba(231,76,60,0.2)", borderColor: "rgba(231,76,60,0.3)" },
  badgeText:    { fontSize: 12, fontWeight: "700", color: "#4A90D9" },
  badgeTextLow: { color: "#E74C3C" },

  daysRow:       { flexDirection: "row", gap: 4, flexWrap: "wrap", marginBottom: 2 },
  dayChip:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  dayChipActive: { backgroundColor: "rgba(74,144,217,0.25)", borderColor: "rgba(74,144,217,0.4)" },
  dayText:       { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600" },
  dayTextActive: { color: "#4A90D9", fontWeight: "700" },

  timingsCol: { gap: 5 },
  mealChip:   { backgroundColor: "rgba(230,126,34,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "rgba(230,126,34,0.25)" },
  mealText:   { fontSize: 12, color: "#E67E22", fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  editBtn: {
    flex: 1, backgroundColor: "rgba(74,144,217,0.15)",
    paddingVertical: 9, borderRadius: 10,
    alignItems: "center", borderWidth: 1, borderColor: "rgba(74,144,217,0.3)",
  },
  editBtnText:  { color: "#4A90D9", fontWeight: "700", fontSize: 12 },
  deleteBtn: {
    flex: 1, backgroundColor: "rgba(231,76,60,0.12)",
    paddingVertical: 9, borderRadius: 10,
    alignItems: "center", borderWidth: 1, borderColor: "rgba(231,76,60,0.25)",
  },
  deleteBtnText: { color: "#E74C3C", fontWeight: "700", fontSize: 12 },

  addButton: {
    position: "absolute",
    bottom: 28, left: 20, right: 20,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  addButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});