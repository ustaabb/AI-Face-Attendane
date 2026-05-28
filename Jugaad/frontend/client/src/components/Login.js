import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {

const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const handleLogin = async () => {

if (!email || !password) {
  alert("Please enter email and password");
  return;
}

try {

  // 🔥 CLEAR OLD DATA (IMPORTANT FIX)
  localStorage.removeItem("student_token");

  const response = await axios.post(
    "http://127.0.0.1:8000/api/users/login/",
    {
      email: email,
      password: password
    }
  );

  const data = response.data;

  // ✅ FIX: check for token instead of status
  if (data.access) {

    // ✅ store token (important for future APIs)
    localStorage.setItem("student_token", data.access);
    localStorage.setItem("student_role", data.role);
    localStorage.setItem("student_name", data.name);

    alert("Login Successful!");

    navigate("/StudentDashboard");

  } else {

    alert("Login failed");

  }

} catch (error) {

  console.error("Login error:", error.response?.data || error.message);

  alert(
    error.response?.data?.error ||
    "Unable to login. Please check your credentials."
  );

}

};

return (
  <div className="login-box">

    <h2>Student Login</h2>

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

    <button onClick={handleLogin}>
      Login
    </button>

  </div>
);

}

export default Login;