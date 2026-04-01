import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { toYmd } from "../utils/date";

export default function Calendar() {
  const navigate = useNavigate();
  const current = new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  return (
    <PageShell title={`${current.toLocaleString("default", { month: "long" })} ${year}`}>
      <div className="card" style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 10 }}>
        {days.map((d) => (
          <button
            key={d}
            className="btn"
            style={{ border: "1px solid #d8e4f2", background: "#f7faff" }}
            onClick={() => navigate(`/day-details?date=${toYmd(new Date(year, month, d))}`)}
          >
            {d}
          </button>
        ))}
      </div>
    </PageShell>
  );
}
