import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
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

const DAY_SHORT = {
  MONDAY:    "MON",
  TUESDAY:   "TUE",
  WEDNESDAY: "WED",
  THURSDAY:  "THU",
  FRIDAY:    "FRI",
  SATURDAY:  "SAT",
  SUNDAY:    "SUN",
};

const MEAL_TIMES = [
  "Before Breakfast",
  "After Breakfast",
  "Before Lunch",
  "After Lunch",
  "Before Dinner",
  "After Dinner",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasUnsavedChanges(name, quantity, startDate, selectedDays) {
  return (
    name.trim()         !== "" ||
    quantity            !== "" ||
    startDate           !== "" ||
    selectedDays.length  > 0
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

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

// ─── DayScheduleRow ───────────────────────────────────────────────────────────

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

  const {
    userId:      paramUserId,
    editMode:    paramEditMode,
    medicineId:  paramMedicineId,
    name:        paramName,
    quantity:    paramQuantity,
    startDate:   paramStartDate,
    days:        paramDays,
    dayTimesMap: paramDayTimesMap,
  } = useLocalSearchParams();

  const isEditMode = paramEditMode === "true";

  // rebuild selectedDays from full names → short for edit mode
  const initialDays = (() => {
    if (!paramDays) return [];
    try { return JSON.parse(paramDays).map((d) => DAY_SHORT[d] || d); }
    catch { return []; }
  })();

  // rebuild dayTimes from dayTimesMap for edit mode
  const initialDayTimes = (() => {
    if (!paramDayTimesMap) return {};
    try { return JSON.parse(paramDayTimesMap); }
    catch { return {}; }
  })();

  const [name,         setName]         = useState(paramName      || "");
  const [quantity,     setQuantity]     = useState(paramQuantity  || "");
  const [startDate,    setStartDate]    = useState(paramStartDate || "");
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [dayTimes,     setDayTimes]     = useState(initialDayTimes);
  const [loading,      setLoading]      = useState(false);

  // ── confirm discard — uses router.replace for web compatibility
  const confirmGoBack = () => {
    if (hasUnsavedChanges(name, quantity, startDate, selectedDays)) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Stay",    style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.replace("/home"),   // ✅ replace not back
          },
        ]
      );
    } else {
      router.replace("/home");   // ✅ replace not back
    }
  };

  // ── Android hardware back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => { confirmGoBack(); return true; }
    );
    return () => backHandler.remove();
  }, [name, quantity, startDate, selectedDays]);

  // ── toggle day chip
  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
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

  // ── toggle meal time for a day
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
    if (!name.trim()) {
      Alert.alert("Error", "Please enter medicine name"); return false;
    }
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

  // ── submit — handles both ADD and EDIT
  const handleSubmit = async () => {
    if (!validate()) return;
    if (loading) return;   // ✅ prevent double tap
    setLoading(true);

    try {
      const userId = paramUserId || (await AsyncStorage.getItem("userId"));

      if (!userId) {
        Alert.alert("Error", "Session expired. Please login again.");
        router.replace("/login");
        return;
      }

      // schedule payload — same for both add and edit
      const schedulePayload = {
        userId,
        days:        selectedDays.map((d) => DAY_FULL[d]),
        times:       [...new Set(Object.values(dayTimes).flat())],
        dayTimesMap: dayTimes,
      };

      if (isEditMode) {
        // ── EDIT MODE
        console.log("=== EDIT MODE ===");

        // 1 — update medicine quantity
        await axios.put(`${api}/medicine/update/${paramMedicineId}`, {
          quantity: parseInt(quantity),
        });

        // 2 — update schedule (saveOrUpdate handles delete + save)
        await axios.post(`${api}/schedule/add`, {
          ...schedulePayload,
          medicineId: paramMedicineId,
        });

        Alert.alert("Success", `${name} updated successfully!`, [
          {
            text: "OK",
            onPress: () => router.replace("/home"),   // ✅ replace not back
          },
        ]);

      } else {
        // ── ADD MODE
        console.log("=== ADD MODE ===");

        const medicinePayload = {
          userId,
          name:      name.trim(),
          quantity:  parseInt(quantity),
          startDate,
          active:    true,
          createdAt: new Date().toISOString(),
        };

        console.log("Medicine Payload:", JSON.stringify(medicinePayload));
        console.log("URL:", `${api}/medicine/add`);

        // 1 — save medicine
        const medRes     = await axios.post(`${api}/medicine/add`, medicinePayload);
        const medicineId = medRes.data.id;
        console.log("Medicine saved, id:", medicineId);

        // 2 — save schedule
        await axios.post(`${api}/schedule/add`, {
          ...schedulePayload,
          medicineId,
        });
        console.log("Schedule saved");

        Alert.alert("Success", `${name} added successfully!`, [
          {
            text: "OK",
            onPress: () => router.replace("/home"),   // ✅ replace not back
          },
        ]);
      }

    } catch (error) {
      console.log("Submit error:", error);
      console.log("Status:", error.response?.status);
      console.log("Data:",   error.response?.data);
      console.log("URL:",    error.config?.url);

      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        "Something went wrong";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={confirmGoBack}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Medicine" : "Add Medicine"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* 1 — Name */}
        <SectionTitle number="1" title="Medicine Name" />
        <TextInput
          style={[styles.input, isEditMode && styles.inputDisabled]}
          placeholder="e.g. Paracetamol 500mg"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          editable={!isEditMode}
        />

        {/* 2 — Quantity */}
        <SectionTitle number="2" title="Quantity" subtitle="Total number of tablets / capsules" />
        <TextInput
          style={styles.input}
          placeholder="e.g. 30"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        {/* 3 — Start Date */}
        <SectionTitle number="3" title="Start Date" subtitle="Format: YYYY-MM-DD" />
        <TextInput
          style={[styles.input, isEditMode && styles.inputDisabled]}
          placeholder="e.g. 2025-03-20"
          placeholderTextColor="#aaa"
          value={startDate}
          onChangeText={setStartDate}
          keyboardType="numbers-and-punctuation"
          editable={!isEditMode}
        />

        {/* 4 — Days */}
        <SectionTitle
          number="4"
          title="Days of the Week"
          subtitle="Select which days to take this medicine"
        />
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

        {/* 5 — Schedule per day */}
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
            : <Text style={styles.submitText}>
                {isEditMode ? "💾  Update Medicine" : "💊  Save Medicine"}
              </Text>
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE       = "#2E86DE";
const LIGHT_BLUE = "#E8F4FF";

const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: "#F4F7FB" },

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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  backArrow:   { fontSize: 20, color: "#fff", lineHeight: 22 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20 },

  sectionTitle: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginTop: 24, marginBottom: 10,
  },
  sectionNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BLUE, alignItems: "center", justifyContent: "center",
  },
  sectionNumberText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sectionLabel:      { fontSize: 16, fontWeight: "700", color: "#1a1a2e" },
  sectionSub:        { fontSize: 12, color: "#999", marginTop: 1 },

  input: {
    backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#1a1a2e",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    color: "#aaa",
  },

  allDaysBtn: {
    alignSelf: "flex-start", backgroundColor: LIGHT_BLUE,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: BLUE,
  },
  allDaysText: { color: BLUE, fontWeight: "600", fontSize: 13 },

  daysRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 24, backgroundColor: "#fff",
    borderWidth: 1.5, borderColor: "#ddd",
    minWidth: 52, alignItems: "center",
  },
  dayChipActive:     { backgroundColor: BLUE, borderColor: BLUE },
  dayChipText:       { fontSize: 13, fontWeight: "600", color: "#888" },
  dayChipTextActive: { color: "#fff" },

  dayScheduleBlock: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 14, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  dayScheduleLabel: {
    fontSize: 14, fontWeight: "700", color: BLUE,
    marginBottom: 10, letterSpacing: 0.5,
  },
  timesGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F4F7FB",
    borderWidth: 1, borderColor: "#e0e0e0",
  },
  timeChipActive:     { backgroundColor: "#FFF3E0", borderColor: "#E67E22" },
  timeChipText:       { fontSize: 12, color: "#888", fontWeight: "500" },
  timeChipTextActive: { color: "#E67E22", fontWeight: "700" },

  footer: { padding: 20, paddingBottom: 36, backgroundColor: "#F4F7FB" },
  submitBtn: {
    backgroundColor: BLUE, paddingVertical: 16,
    borderRadius: 16, alignItems: "center",
    shadowColor: BLUE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: "#a0c4f1" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});