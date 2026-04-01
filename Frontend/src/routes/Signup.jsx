import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../api/client";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post("/user/signup", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (res.data === "true" || res.status === 200) {
        alert("Account created successfully");
        navigate("/login", { replace: true });
      } else {
        alert("User already exists");
      }
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "grid", placeItems: "center" }}>
      <form className="card" onSubmit={handleSignup} style={{ width: "100%", maxWidth: 420, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Create Account</h2>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Please wait..." : "Create Account"}
        </button>
        <p style={{ textAlign: "center", marginBottom: 0 }}>
          <Link to="/login">Already have an account? Login</Link>
        </p>
      </form>
    </div>
  );
}
