import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../private";

export default function DayDetails() {

  const { date } = useLocalSearchParams();

  const [data, setData] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
      fetchData(id);
    };
    init();
  }, []);

  const fetchData = async (id) => {
    try {
      // all medicines
      const medRes = await axios.get(`${api}/medicine/${id}`);
      const meds   = medRes.data || [];

      // schedules
      const schRes = await axios.get(`${api}/schedule/user/${id}`);
      const schedules = schRes.data || [];

      const map = {};
      schedules.forEach((s) => {
        map[s.medicineId] = s;
      });

      // logs for selected date
      let takenMap = {};
      try {
        const logRes = await axios.get(`${api}/logs/${id}/${date}`);
        const logs   = logRes.data || [];

        logs.forEach((l) => {
          if (!takenMap[l.medicineId]) takenMap[l.medicineId] = [];
          takenMap[l.medicineId].push(l.timing);
        });
      } catch (e) {}

      // build final list
      const result = [];

      meds.forEach((m) => {
        const sch = map[m.id];
        if (!sch) return;

        const allTimes = sch.times || [];
        const taken    = takenMap[m.id] || [];

        allTimes.forEach((t) => {
          result.push({
            name: m.name,
            timing: t,
            status: taken.includes(t) ? "Taken" : "Missed",
          });
        });
      });

      setData(result);

    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 {date}</Text>

      <FlatList
        data={data}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text
              style={[
                styles.status,
                item.status === "Taken" ? styles.green : styles.red,
              ]}
            >
              {item.status} — {item.timing}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F7FB" },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  status: {
    marginTop: 5,
    fontSize: 14,
  },

  green: { color: "green" },
  red: { color: "red" },
});