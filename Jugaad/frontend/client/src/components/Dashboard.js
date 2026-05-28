import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>AI Attendance Marker</h1>
      <p>Smart attendance using Face Recognition & QR</p>

      <button onClick={() => navigate("/Login")} style={{ margin: "10px" }}>
        Login
      </button>

      <button onClick={() => navigate("/Register")} style={{ margin: "10px" }}>
        Register
      </button>
    </div>
  );
}

export default Dashboard;
