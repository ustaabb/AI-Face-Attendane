import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TeacherLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {

    // 🔥 VALIDATION
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // 🔥 CLEAR OLD DATA (IMPORTANT FIX)
      localStorage.removeItem("teacher_token");

      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/teacher/login/",
        {
          email: email.trim().toLowerCase(),   // 🔥 normalize
          password: password.trim(),
        }
      );

      console.log("LOGIN SUCCESS:", res.data);

      // 🔥 STORE AUTH DATA
      localStorage.setItem("teacher_token", res.data.access);
      localStorage.setItem("teacher_role", res.data.role);
      localStorage.setItem("teacher_name", res.data.name);

      alert(`Welcome ${res.data.name} 👨‍🏫`);

      navigate("/teacher-dashboard");

    } catch (err) {

      console.error("LOGIN ERROR:", err.response || err);

      // 🔥 BETTER ERROR HANDLING
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else if (err.response?.status === 401) {
        alert("Invalid email or password ❌");
      } else {
        alert("Server error, try again");
      }

    } finally {
      setLoading(false);
    }
  };

return (
  <div className="login-wrapper">

    <div className="login-box">

      <h2>Teacher Login</h2>

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