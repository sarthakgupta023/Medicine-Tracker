import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CalendarScreen() {

  const [currentDate] = useState(new Date());

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateClick = (day) => {
    const dateStr = new Date(year, month, day)
      .toISOString()
      .split("T")[0];

    router.push({
      pathname: "/dayDetails",
      params: { date: dateStr },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        📅 {currentDate.toLocaleString("default", { month: "long" })} {year}
      </Text>

      <View style={styles.grid}>
        {dates.map((d) => (
          <TouchableOpacity
            key={d}
            style={styles.dayBox}
            onPress={() => handleDateClick(d)}
          >
            <Text style={styles.dayText}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F7FB" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  dayBox: {
    width: "13%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
});