import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../private";

// ─── helpers ────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEALS = ["Before Breakfast", "After Breakfast", "Before Lunch", "After Lunch", "Before Dinner", "After Dinner"];

/** derive which days of the week a medicine is taken based on gapDays */
function getScheduleDays(startDate, durationDays, gapDays) {
  if (!startDate) return [];
  const start = new Date(startDate);
  const result = [];
  for (let d = 0; d < durationDays; d += (gapDays > 0 ? gapDays : 1)) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const day = DAYS[date.getDay()];
    if (!result.includes(day)) result.push(day);
  }
  return result;
}
// ─── MedicineCard ────────────────────────────────────────────────────────────
function MedicineCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: expanded ? 0 : 1,
      duration: 280,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const scheduleDays = getScheduleDays(item.startDate, item.durationDays, item.gapDays);

  const cardHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 260],
  });

  const arrowRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View style={[styles.card, { height: cardHeight, overflow: "hidden" }]}>
      {/* Header row */}
      <TouchableOpacity style={styles.cardHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.cardLeft}>
          <View style={styles.pillDot} />
          <Text style={styles.medicineName}>{item.name}</Text>
        </View>
        <Animated.Text style={[styles.arrow, { transform: [{ rotate: arrowRotate }] }]}>
          ▼
        </Animated.Text>
      </TouchableOpacity>

      {/* Expanded details */}
      <View style={styles.cardBody}>

        {/* Quantity */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💊 Remaining</Text>
          <View style={[styles.badge, item.quantity < 5 && styles.badgeLow]}>
            <Text style={styles.badgeText}>{item.quantity} tablets</Text>
          </View>
        </View>

        {/* Schedule days */}
        <Text style={styles.detailLabel}>📅 Schedule</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d) => (
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

        {/* Meal times */}
        <Text style={styles.detailLabel}>🍽 Timing</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.mealsRow}>
            {MEALS.map((m) => (
              <View key={m} style={styles.mealChip}>
                <Text style={styles.mealText}>{m}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

      </View>
    </Animated.View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function Home() {
  const { email } = useLocalSearchParams();
  const [userId, setUserId] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // resolve userId from email if not passed directly
  useEffect(() => {
    const init = async () => {
      try {
        const savedEmail = email || (await AsyncStorage.getItem("userEmail"));
        const savedUserId = await AsyncStorage.getItem("userId");

        if (savedUserId) {
          setUserId(savedUserId);
          fetchMedicines(savedUserId);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.log("Init error:", e);
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchMedicines = async (id) => {
    try {
      const response = await axios.get(`${api}/medicine/${id}`);
      setMedicines(response.data);
    } catch (error) {
      console.log("Fetch medicines error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  // ── render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>My Medicines</Text>
          <Text style={styles.sub}>{email || "your medicines"}</Text>
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
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Medicines Added</Text>
          <Text style={styles.emptySubtitle}>Your medicine list is empty.{"\n"}Tap the button below to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MedicineCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  // ── top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2E86DE",
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── center states
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 12,
    color: "#888",
    fontSize: 14,
  },

  // ── list
  list: {
    padding: 16,
    paddingBottom: 100,
  },

  // ── card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#2E86DE",
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
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E86DE",
  },
  medicineName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  arrow: {
    fontSize: 13,
    color: "#2E86DE",
  },

  // ── expanded body
  cardBody: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 4,
  },

  // quantity badge
  badge: {
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeLow: {
    backgroundColor: "#FFE8E8",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E86DE",
  },

  // day chips
  daysRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  dayChipActive: {
    backgroundColor: "#2E86DE",
  },
  dayText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  dayTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // meal chips
  mealsRow: {
    flexDirection: "row",
    gap: 8,
  },
  mealChip: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mealText: {
    fontSize: 12,
    color: "#E67E22",
    fontWeight: "600",
  },

  // ── add button
  addButton: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
    backgroundColor: "#2E86DE",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2E86DE",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});