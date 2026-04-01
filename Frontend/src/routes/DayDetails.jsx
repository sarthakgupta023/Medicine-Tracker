import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import { client } from "../api/client";
import { DAY_KEYS, DAY_SHORT, parseYmdToLocalDate } from "../utils/date";

export default function DayDetails() {
  const [params] = useSearchParams();
  const selectedDate = params.get("date");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const run = async () => {
      const userId = localStorage.getItem("userId");
      const selected = parseYmdToLocalDate(selectedDate);
      if (!selected) return setItems([]);
      const full = DAY_KEYS[selected.getDay()];
      const short = DAY_SHORT[full];
      const meds = (await client.get(`/medicine/${userId}`)).data || [];
      const schedules = (await client.get(`/schedule/user/${userId}`)).data || [];
      const smap = {};
      schedules.forEach((s) => { smap[s.medicineId] = s; });
      let logs = [];
      try { logs = (await client.get(`/logs/${userId}/${selectedDate}`)).data || []; } catch {}
      const taken = {};
      logs.forEach((l) => {
        if (!taken[l.medicineId]) taken[l.medicineId] = [];
        taken[l.medicineId].push(l.timing);
      });
      const result = [];
      meds.forEach((m) => {
        const sch = smap[m.id];
        if (!sch || !sch.days?.includes(full)) return;
        const start = parseYmdToLocalDate(m.startDate);
        if (start && start > selected) return;
        const times = sch.dayTimesMap?.[short]?.length ? sch.dayTimesMap[short] : (sch.times || []);
        times.forEach((t) => result.push({ name: m.name, timing: t, status: (taken[m.id] || []).includes(t) ? "Taken" : "Missed" }));
      });
      setItems(result);
    };
    run();
  }, [selectedDate]);

  return (
    <PageShell title={`Date: ${selectedDate || ""}`}>
      {items.length === 0 ? <div className="card" style={{ padding: 14 }}>No medicine taken on this date</div> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it, idx) => (
          <div key={`${it.name}-${it.timing}-${idx}`} className="card" style={{ padding: 12 }}>
            <strong>{it.name}</strong>
            <div style={{ marginTop: 6, color: it.status === "Taken" ? "#27AE60" : "#E74C3C" }}>
              {it.status} - {it.timing}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
