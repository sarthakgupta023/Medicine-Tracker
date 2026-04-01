import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { client } from "../api/client";
import { DAY_KEYS, toYmd } from "../utils/date";

export default function Today() {
  const userId = localStorage.getItem("userId");
  const [rows, setRows] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [takenMap, setTakenMap] = useState({});
  const todayDate = toYmd(new Date());
  const todayKey = DAY_KEYS[new Date().getDay()];

  const fetchAll = useCallback(async () => {
    const medRes = await client.get(`/medicine/${userId}`);
    const meds = medRes.data || [];
    const schRes = await client.get(`/schedule/user/${userId}`);
    const map = {};
    (schRes.data || []).forEach((s) => { map[s.medicineId] = s; });
    setScheduleMap(map);
    let logs = [];
    try {
      const logRes = await client.get(`/logs/${userId}/${todayDate}`);
      logs = logRes.data || [];
    } catch {}
    const tk = {};
    logs.forEach((l) => {
      if (!tk[l.medicineId]) tk[l.medicineId] = new Set();
      tk[l.medicineId].add(l.timing);
    });
    setTakenMap(tk);
    setRows(meds.filter((m) => map[m.id]?.days?.includes(todayKey)));
  }, [todayDate, todayKey, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const total = rows.length;
  const remaining = useMemo(() => rows.filter((m) => {
    const times = scheduleMap[m.id]?.times || [];
    const taken = takenMap[m.id] || new Set();
    return times.some((t) => !taken.has(t));
  }).length, [rows, scheduleMap, takenMap]);

  const markTaken = async (m, timing) => {
    await client.put(`/medicine/update/${m.id}`, { quantity: m.quantity - 1 });
    await client.post("/logs/taken", { userId, medicineId: m.id, takenDate: todayDate, timing });
    fetchAll();
  };

  return (
    <PageShell title="Today's Dose" subtitle={new Date().toDateString()}>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <strong>{total - remaining} / {total} completed</strong>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((m) => {
          const times = scheduleMap[m.id]?.times || [];
          const taken = takenMap[m.id] || new Set();
          const left = times.filter((t) => !taken.has(t));
          return (
            <div key={m.id} className="card" style={{ padding: 12 }}>
              <strong>{m.name}</strong>
              <div style={{ color: "#5F7082", marginBottom: 10 }}>Qty: {m.quantity}</div>
              {left.length === 0 ? <div>All timings completed</div> : left.map((t) => (
                <button key={t} className="btn btn-primary" style={{ marginRight: 8, marginBottom: 8 }} onClick={() => markTaken(m, t)}>
                  Taken - {t}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
