import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return alert("Please enter email and password");
    setLoading(true);
    try {
      const { data } = await client.post("/user/login", {
        email: email.trim(),
        password: password.trim(),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userEmail", data.email || email.trim());
      navigate("/home", { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "grid", placeItems: "center" }}>
      <form className="card" onSubmit={handleLogin} style={{ width: "100%", maxWidth: 420, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Please wait..." : "Login"}
        </button>
        <p style={{ textAlign: "center", marginBottom: 0 }}>
          <Link to="/signup">Don't have an account? Signup</Link>
        </p>
      </form>
    </div>
  );
}
