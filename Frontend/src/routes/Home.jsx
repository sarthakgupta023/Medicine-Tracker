import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../api/client";
import PageShell from "../components/PageShell";

export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [email, setEmail] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const medRes = await client.get(`/medicine/${userId}`);
      setMedicines(medRes.data || []);
      const schRes = await client.get(`/schedule/user/${userId}`);
      const map = {};
      (schRes.data || []).forEach((s) => { map[s.medicineId] = s; });
      setScheduleMap(map);
    } catch (e) {
      if (e.response?.status === 404) {
        setMedicines([]);
        setScheduleMap({});
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return navigate("/login", { replace: true });
    setEmail(localStorage.getItem("userEmail") || "");
    fetchAll();
  }, [userId, navigate, fetchAll]);

  const handleDelete = async (medicineId) => {
    if (!window.confirm("Delete medicine?")) return;
    await client.delete(`/schedule/delete/${medicineId}`);
    await client.delete(`/medicine/delete/${medicineId}`);
    fetchAll();
  };

  return (
    <PageShell
      title="My Medicines"
      subtitle={email || "Dashboard"}
      right={<div style={{ display: "flex", gap: 8 }}>
        <Link className="btn" to="/calendar">Calendar</Link>
        <Link className="btn" to="/today">Today</Link>
        <button className="btn" onClick={() => { localStorage.clear(); navigate("/login", { replace: true }); }}>Logout</button>
      </div>}
    >
      <div style={{ display: "grid", gap: 12 }}>
        {loading ? <div className="card" style={{ padding: 14 }}>Loading...</div> : null}
        {!loading && medicines.length === 0 ? <div className="card" style={{ padding: 14 }}>No medicines added</div> : null}
        {medicines.map((m) => {
          const sch = scheduleMap[m.id];
          const expanded = !!open[m.id];
          return (
            <div key={m.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{m.name}</strong>
                <button className="btn" onClick={() => setOpen((p) => ({ ...p, [m.id]: !p[m.id] }))}>{expanded ? "Hide" : "Show"}</button>
              </div>
              <div style={{ color: "#5F7082", marginTop: 6 }}>Quantity: {m.quantity}</div>
              {expanded ? (
                <div style={{ marginTop: 10 }}>
                  <div>Days: {(sch?.days || []).join(", ") || "No schedule"}</div>
                  <div>Times: {(sch?.times || []).join(", ") || "No timings"}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <Link className="btn" to={`/add-medicine?editMode=true&medicineId=${m.id}&name=${encodeURIComponent(m.name)}&quantity=${m.quantity}&startDate=${m.startDate}&days=${encodeURIComponent(JSON.stringify(sch?.days || []))}&dayTimesMap=${encodeURIComponent(JSON.stringify(sch?.dayTimesMap || {}))}`}>Edit</Link>
                    <button className="btn" onClick={() => handleDelete(m.id)}>Delete</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{ position: "fixed", right: 20, bottom: 20 }}>
        <Link className="btn btn-primary" to="/add-medicine">+ Add Medicine</Link>
      </div>
    </PageShell>
  );
}
