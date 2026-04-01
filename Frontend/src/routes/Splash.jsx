import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const t = setTimeout(() => {
      navigate(token && userId ? "/home" : "/login", { replace: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="page" style={{ display: "grid", placeItems: "center" }}>
      <div className="card" style={{ padding: 28, textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>Medicine Tracker</h2>
        <p style={{ marginBottom: 0, color: "#5F7082" }}>Loading...</p>
      </div>
    </div>
  );
}
