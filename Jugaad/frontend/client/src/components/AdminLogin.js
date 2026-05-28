import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // 🔥 clear old token
      localStorage.removeItem("admin_token");

      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/admin/login/",
        {
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }
      );

      console.log("ADMIN LOGIN:", res.data);

      // 🔐 store token
      localStorage.setItem("admin_token", res.data.access);
      localStorage.setItem("admin_role", res.data.role);
      localStorage.setItem("admin_name", res.data.name);

      alert(`Welcome ${res.data.name} 👑`);

      navigate("/admin-dashboard");

    } catch (err) {

      console.error(err);

      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Login failed ❌");
      }

    } finally {
      setLoading(false);
    }
  };

return (
  <div className="login-wrapper">

    <div className="login-box">

      <h2>Admin Login</h2>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

    </div>

  </div>
);
}