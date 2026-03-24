import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../private";

const ALL_DAYS   = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_FULL   = { MON: "MONDAY", TUE: "TUESDAY", WED: "WEDNESDAY", THU: "THURSDAY", FRI: "FRIDAY", SAT: "SATURDAY", SUN: "SUNDAY" };
const DAY_SHORT  = { MONDAY: "MON", TUESDAY: "TUE", WEDNESDAY: "WED", THURSDAY: "THU", FRIDAY: "FRI", SATURDAY: "SAT", SUNDAY: "SUN" };
const MEAL_TIMES = ["Before Breakfast","After Breakfast","Before Lunch","After Lunch","Before Dinner","After Dinner"];

function hasUnsavedChanges(name, quantity, startDate, selectedDays) {
  return name.trim() !== "" || quantity !== "" || startDate !== "" || selectedDays.length > 0;
}

function SectionTitle({ number, title, subtitle }) {
  return (
    <View style={styles.sectionTitle}>
      <LinearGradient colors={["#4A90D9", "#2D6BB5"]} style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </LinearGradient>
      <View>
        <Text style={styles.sectionLabel}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

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
              <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AddMedicine() {
  const {
    userId: paramUserId, editMode: paramEditMode, medicineId: paramMedicineId,
    name: paramName, quantity: paramQuantity, startDate: paramStartDate,
    days: paramDays, dayTimesMap: paramDayTimesMap,
  } = useLocalSearchParams();

  const isEditMode = paramEditMode === "true";

  const initialDays = (() => {
    if (!paramDays) return [];
    try { return JSON.parse(paramDays).map((d) => DAY_SHORT[d] || d); } catch { return []; }
  })();

  const initialDayTimes = (() => {
    if (!paramDayTimesMap) return {};
    try { return JSON.parse(paramDayTimesMap); } catch { return {}; }
  })();

  const [name,         setName]         = useState(paramName      || "");
  const [quantity,     setQuantity]     = useState(paramQuantity  || "");
  const [startDate,    setStartDate]    = useState(paramStartDate || "");
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [dayTimes,     setDayTimes]     = useState(initialDayTimes);
  const [loading,      setLoading]      = useState(false);

  const confirmGoBack = () => {
    if (hasUnsavedChanges(name, quantity, startDate, selectedDays)) {
      Alert.alert("Discard Changes?", "You have unsaved changes. Go back?", [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.replace("/home") },
      ]);
    } else {
      router.replace("/home");
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => { confirmGoBack(); return true; });
    return () => backHandler.remove();
  }, [name, quantity, startDate, selectedDays]);

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        const next = { ...dayTimes }; delete next[day]; setDayTimes(next);
        return prev.filter((d) => d !== day);
      } else {
        setDayTimes((t) => ({ ...t, [day]: [] }));
        return [...prev, day];
      }
    });
  };

  const toggleTime = (day, time) => {
    setDayTimes((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(time) ? current.filter((t) => t !== time) : [...current, time];
      return { ...prev, [day]: updated };
    });
  };

  const toggleAll = () => {
    if (selectedDays.length === ALL_DAYS.length) {
      setSelectedDays([]); setDayTimes({});
    } else {
      const newTimes = {};
      ALL_DAYS.forEach((d) => { newTimes[d] = dayTimes[d] || []; });
      setSelectedDays([...ALL_DAYS]); setDayTimes(newTimes);
    }
  };

  const validate = () => {
    if (!name.trim())                           { Alert.alert("Error", "Please enter medicine name");      return false; }
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) { Alert.alert("Error", "Please enter valid quantity"); return false; }
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert("Error", "Enter start date: YYYY-MM-DD"); return false; }
    if (selectedDays.length === 0)              { Alert.alert("Error", "Select at least one day");        return false; }
    for (const day of selectedDays) {
      if (!dayTimes[day] || dayTimes[day].length === 0) {
        Alert.alert("Error", `Pick at least one timing for ${DAY_FULL[day]}`); return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    try {
      const userId = paramUserId || (await AsyncStorage.getItem("userId"));
      if (!userId) { Alert.alert("Error", "Session expired."); router.replace("/login"); return; }

      const schedulePayload = {
        userId, days: selectedDays.map((d) => DAY_FULL[d]),
        times: [...new Set(Object.values(dayTimes).flat())], dayTimesMap: dayTimes,
      };

      if (isEditMode) {
        await axios.put(`${api}/medicine/update/${paramMedicineId}`, { quantity: parseInt(quantity) });
        await axios.post(`${api}/schedule/add`, { ...schedulePayload, medicineId: paramMedicineId });
        Alert.alert("Success", `${name} updated!`, [{ text: "OK", onPress: () => router.replace("/home") }]);
      } else {
        const medRes     = await axios.post(`${api}/medicine/add`, {
          userId, name: name.trim(), quantity: parseInt(quantity),
          startDate, active: true, createdAt: new Date().toISOString(),
        });
        await axios.post(`${api}/schedule/add`, { ...schedulePayload, medicineId: medRes.data.id });
        Alert.alert("Success", `${name} added!`, [{ text: "OK", onPress: () => router.replace("/home") }]);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || "Something went wrong";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0A1628", "#0D2347", "#1A3A6B"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTR]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={confirmGoBack} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit Medicine" : "Add Medicine"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1 — Name */}
          <SectionTitle number="1" title="Medicine Name" />
          <View style={[styles.inputWrap, isEditMode && styles.inputWrapDisabled]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paracetamol 500mg"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={name}
              onChangeText={setName}
              editable={!isEditMode}
            />
          </View>

          {/* 2 — Quantity */}
          <SectionTitle number="2" title="Quantity" subtitle="Total tablets / capsules" />
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          {/* 3 — Start Date */}
          <SectionTitle number="3" title="Start Date" subtitle="Format: YYYY-MM-DD" />
          <View style={[styles.inputWrap, isEditMode && styles.inputWrapDisabled]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-03-20"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={startDate}
              onChangeText={setStartDate}
              keyboardType="numbers-and-punctuation"
              editable={!isEditMode}
            />
          </View>

          {/* 4 — Days */}
          <SectionTitle number="4" title="Days of the Week" subtitle="Which days to take this medicine" />
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
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 5 — Schedule */}
          {selectedDays.length > 0 && (
            <>
              <SectionTitle number="5" title="Daily Schedule" subtitle="Meal timings for each day" />
              {selectedDays.map((day) => (
                <DayScheduleRow
                  key={day} day={day}
                  selectedTimes={dayTimes[day] || []}
                  onToggleTime={toggleTime}
                />
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ["#3a6ea0","#2a5280"] : ["#4A90D9","#2D6BB5"]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>
                    {isEditMode ? "💾  Update Medicine" : "💊  Save Medicine"}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  blob: { position: "absolute", borderRadius: 999, opacity: 0.12 },
  blobTR: { width: 280, height: 280, backgroundColor: "#4A90D9", top: -60, right: -80 },

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
  backArrow:   { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 10 },

  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, marginBottom: 10 },
  sectionNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sectionNumberText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
  sectionSub:   { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },

  inputWrap: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
  },
  inputWrapDisabled: { backgroundColor: "rgba(255,255,255,0.04)" },
  input: { color: "#fff", fontSize: 15, fontWeight: "500", paddingVertical: 14 },

  allDaysBtn: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(74,144,217,0.15)",
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(74,144,217,0.35)",
  },
  allDaysText: { color: "#4A90D9", fontWeight: "700", fontSize: 13 },

  daysRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    minWidth: 52, alignItems: "center",
  },
  dayChipActive:     { backgroundColor: "rgba(74,144,217,0.25)", borderColor: "#4A90D9" },
  dayChipText:       { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.35)" },
  dayChipTextActive: { color: "#fff" },

  dayScheduleBlock: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  dayScheduleLabel: { fontSize: 13, fontWeight: "800", color: "#4A90D9", marginBottom: 10, letterSpacing: 0.5 },
  timesGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  timeChipActive:     { backgroundColor: "rgba(230,126,34,0.2)", borderColor: "rgba(230,126,34,0.5)" },
  timeChipText:       { fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  timeChipTextActive: { color: "#E67E22", fontWeight: "700" },

  footer: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12 },
  submitBtn: {
    height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});