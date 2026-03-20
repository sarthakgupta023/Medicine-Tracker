import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../private";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const DAY_FULL = {
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
  SUN: "SUNDAY",
};

const MEAL_TIMES = [
  "Before Breakfast",
  "After Breakfast",
  "Before Lunch",
  "After Lunch",
  "Before Dinner",
  "After Dinner",
];

// ─── Small reusable components ────────────────────────────────────────────────

/** Section heading */
function SectionTitle({ number, title, subtitle }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <View>
        <Text style={styles.sectionLabel}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Day schedule row — shown once per selected day */
function DayScheduleRow({ day, selectedTimes, onToggleTime }) {
  return (
    <View style={styles.dayScheduleBlock}>
      <Text style={styles.dayScheduleLabel}>{DAY_FULL[day]}</Text>
      <View style={styles.timesGrid}>
        {MEAL_TIMES.map((t) => {
          const active = selectedTimes.includes(t);
          return (
            <TouchableOpacity
              key={t}
              style={[styles.timeChip, active && styles.timeChipActive]}
              onPress={() => onToggleTime(day, t)}
              activeOpacity={0.75}
            >
              <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddMedicine() {
  const { userId: paramUserId } = useLocalSearchParams();

  // ── form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [startDate, setStartDate] = useState("");          // "YYYY-MM-DD"
  const [selectedDays, setSelectedDays] = useState([]);   // ["MON","WED",...]
  // dayTimes: { MON: ["Before Breakfast","After Dinner"], WED: [...], ... }
  const [dayTimes, setDayTimes] = useState({});
  const [loading, setLoading] = useState(false);

  // ── toggle a day chip
  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        // remove day + its times
        const next = { ...dayTimes };
        delete next[day];
        setDayTimes(next);
        return prev.filter((d) => d !== day);
      } else {
        setDayTimes((t) => ({ ...t, [day]: [] }));
        return [...prev, day];
      }
    });
  };

  // ── toggle a meal time for a specific day
  const toggleTime = (day, time) => {
    setDayTimes((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(time)
        ? current.filter((t) => t !== time)
        : [...current, time];
      return { ...prev, [day]: updated };
    });
  };

  // ── select / deselect ALL days
  const toggleAll = () => {
    if (selectedDays.length === ALL_DAYS.length) {
      setSelectedDays([]);
      setDayTimes({});
    } else {
      const newTimes = {};
      ALL_DAYS.forEach((d) => { newTimes[d] = dayTimes[d] || []; });
      setSelectedDays([...ALL_DAYS]);
      setDayTimes(newTimes);
    }
  };

  // ── validation
  const validate = () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter medicine name"); return false; }
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity"); return false;
    }
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Error", "Enter start date in YYYY-MM-DD format"); return false;
    }
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day"); return false;
    }
    for (const day of selectedDays) {
      if (!dayTimes[day] || dayTimes[day].length === 0) {
        Alert.alert("Error", `Please select at least one timing for ${DAY_FULL[day]}`);
        return false;
      }
    }
    return true;
  };

  // ── submit
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const userId = paramUserId || (await AsyncStorage.getItem("userId"));

      // Build payload
      // Medicine object
      const medicinePayload = {
        userId,
        name: name.trim(),
        quantity: parseInt(quantity),
        startDate,                          // "YYYY-MM-DD"
        active: true,
        createdAt: new Date().toISOString(),
      };

      // Schedule object
      const schedulePayload = {
        userId,
        days: selectedDays.map((d) => DAY_FULL[d]),   // full names for backend
        // flatten all times across all days (unique)
        times: [...new Set(Object.values(dayTimes).flat())],
        // per-day times if your backend supports it
        dayTimesMap: dayTimes,
      };

      // POST medicine first → get its id
      console.log("medicine api jaane se pehle")
      const medRes = await axios.post(`${api}/medicine/add`, medicinePayload);
      console.log("medicine api jaane se baad")
      const medicineId = medRes.data.id;

      //POST schedule with medicineId
      await axios.post(`${api}/schedule/add`, {
        ...schedulePayload,
        medicineId,
      });
      console.log("sab shi hone ke baad")
      Alert.alert("Success", `${name} added successfully!`, [
        { text: "OK", onPress: () => router.back() },
      ]);

    } catch (error) {
      console.log("Add medicine error:", error);
      const msg = error.response?.data?.message
               || error.response?.data
               || "Failed to add medicine";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medicine</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 1. Medicine Name */}
        <SectionTitle number="1" title="Medicine Name" />
        <TextInput
          style={styles.input}
          placeholder="e.g. Paracetamol 500mg"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />

        {/* ── 2. Quantity */}
        <SectionTitle number="2" title="Quantity" subtitle="Total number of tablets / capsules" />
        <TextInput
          style={styles.input}
          placeholder="e.g. 30"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        {/* ── 3. Start Date */}
        <SectionTitle number="3" title="Start Date" subtitle="Format: YYYY-MM-DD" />
        <TextInput
          style={styles.input}
          placeholder="e.g. 2025-03-20"
          placeholderTextColor="#aaa"
          value={startDate}
          onChangeText={setStartDate}
          keyboardType="numbers-and-punctuation"
        />

        {/* ── 4. Days of Week */}
        <SectionTitle
          number="4"
          title="Days of the Week"
          subtitle="Select which days to take this medicine"
        />
        {/* All days shortcut */}
        <TouchableOpacity style={styles.allDaysBtn} onPress={toggleAll}>
          <Text style={styles.allDaysText}>
            {selectedDays.length === ALL_DAYS.length ? "✓ Everyday selected" : "Select Everyday"}
          </Text>
        </TouchableOpacity>

        <View style={styles.daysRow}>
          {ALL_DAYS.map((day) => {
            const active = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 5. Schedule per day */}
        {selectedDays.length > 0 && (
          <>
            <SectionTitle
              number="5"
              title="Daily Schedule"
              subtitle="Pick meal timings for each selected day"
            />
            {selectedDays.map((day) => (
              <DayScheduleRow
                key={day}
                day={day}
                selectedTimes={dayTimes[day] || []}
                onToggleTime={toggleTime}
              />
            ))}
          </>
        )}

        {/* bottom padding */}
        <View style={{ height: 40 }} />

      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>💊  Save Medicine</Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = "#2E86DE";
const LIGHT_BLUE = "#E8F4FF";

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  // ── header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BLUE,
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#fff",
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  // ── scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
  },

  // ── section title
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  sectionSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },

  // ── text input
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a2e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── all days button
  allDaysBtn: {
    alignSelf: "flex-start",
    backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BLUE,
  },
  allDaysText: {
    color: BLUE,
    fontWeight: "600",
    fontSize: 13,
  },

  // ── day chips row
  daysRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ddd",
    minWidth: 52,
    alignItems: "center",
  },
  dayChipActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  dayChipTextActive: {
    color: "#fff",
  },

  // ── day schedule block
  dayScheduleBlock: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dayScheduleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: BLUE,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  timesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F4F7FB",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  timeChipActive: {
    backgroundColor: "#FFF3E0",
    borderColor: "#E67E22",
  },
  timeChipText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  timeChipTextActive: {
    color: "#E67E22",
    fontWeight: "700",
  },

  // ── footer submit
  footer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: "#F4F7FB",
  },
  submitBtn: {
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
  submitBtnDisabled: {
    backgroundColor: "#a0c4f1",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});