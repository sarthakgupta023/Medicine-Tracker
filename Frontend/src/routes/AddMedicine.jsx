import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import { client } from "../api/client";

const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_FULL = { MON: "MONDAY", TUE: "TUESDAY", WED: "WEDNESDAY", THU: "THURSDAY", FRI: "FRIDAY", SAT: "SATURDAY", SUN: "SUNDAY" };
const MEAL_TIMES = ["Before Breakfast", "After Breakfast", "Before Lunch", "After Lunch", "Before Dinner", "After Dinner"];

export default function AddMedicine() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isEditMode = params.get("editMode") === "true";
  const medicineId = params.get("medicineId");
  const initDays = (() => {
    try {
      return JSON.parse(params.get("days") || "[]").map((d) => Object.keys(DAY_FULL).find((k) => DAY_FULL[k] === d) || d);
    } catch { return []; }
  })();
  const initMap = (() => {
    try { return JSON.parse(params.get("dayTimesMap") || "{}"); } catch { return {}; }
  })();

  const [name, setName] = useState(params.get("name") || "");
  const [quantity, setQuantity] = useState(params.get("quantity") || "");
  const [startDate, setStartDate] = useState(params.get("startDate") || "");
  const [selectedDays, setSelectedDays] = useState(initDays);
  const [dayTimes, setDayTimes] = useState(initMap);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    setDayTimes((prev) => ({ ...prev, [day]: prev[day] || [] }));
  };

  const toggleTime = (day, t) => {
    setDayTimes((prev) => {
      const current = prev[day] || [];
      return { ...prev, [day]: current.includes(t) ? current.filter((x) => x !== t) : [...current, t] };
    });
  };

  const handleSubmit = async () => {
    if (!name || !quantity || !startDate || selectedDays.length === 0) return alert("Fill all required fields");
    const userId = localStorage.getItem("userId");
    setLoading(true);
    try {
      const payload = {
        userId,
        days: selectedDays.map((d) => DAY_FULL[d]),
        times: [...new Set(Object.values(dayTimes).flat())],
        dayTimesMap: dayTimes,
      };
      if (isEditMode) {
        await client.put(`/medicine/update/${medicineId}`, { quantity: Number(quantity) });
        await client.post("/schedule/add", { ...payload, medicineId });
      } else {
        const medRes = await client.post("/medicine/add", {
          userId,
          name: name.trim(),
          quantity: Number(quantity),
          startDate,
          active: true,
          createdAt: new Date().toISOString(),
        });
        await client.post("/schedule/add", { ...payload, medicineId: medRes.data.id });
      }
      navigate("/home", { replace: true });
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title={isEditMode ? "Edit Medicine" : "Add Medicine"}>
      <div className="card" style={{ padding: 16 }}>
        <input className="input" placeholder="Medicine name" value={name} onChange={(e) => setName(e.target.value)} disabled={isEditMode} />
        <input className="input" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input className="input" placeholder="YYYY-MM-DD" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isEditMode} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {ALL_DAYS.map((d) => (
            <button key={d} className="btn" style={{ background: selectedDays.includes(d) ? "#2E86DE" : "#fff", color: selectedDays.includes(d) ? "#fff" : "#1A2A3A", border: "1px solid #d8e4f2" }} onClick={() => toggleDay(d)}>
              {d}
            </button>
          ))}
        </div>
        {selectedDays.map((d) => (
          <div key={d} className="card" style={{ padding: 10, marginBottom: 10 }}>
            <strong>{DAY_FULL[d]}</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {MEAL_TIMES.map((t) => {
                const active = (dayTimes[d] || []).includes(t);
                return <button key={t} className="btn" style={{ border: "1px solid #d8e4f2", background: active ? "#fff3e0" : "#fff" }} onClick={() => toggleTime(d, t)}>{t}</button>;
              })}
            </div>
          </div>
        ))}
        <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>{loading ? "Saving..." : "Save Medicine"}</button>
      </div>
    </PageShell>
  );
}
