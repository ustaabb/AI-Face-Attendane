import { useNavigate } from "react-router-dom";
import "../styles/RoleSelect.css";

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="role-container">
      <h1 className="heading">Select Your Role</h1>

      <div className="role-cards">

        {/* Admin */}
        <div
          className="role-card admin"
          onClick={() => navigate("/admin-login")}
        >
          <div className="role-icon">⚙️</div>
          <h2>Admin</h2>
          <p>Manage system, teachers & students</p>
        </div>

        {/* Teacher */}
        <div
          className="role-card teacher"
          onClick={() => navigate("/teacher-login")}
        >
          <div className="role-icon">👨‍🏫</div>
          <h2>Teacher</h2>
          <p>Start attendance sessions</p>
        </div>

        {/* Student */}
        <div
          className="role-card student"
          onClick={() => navigate("/dashboard")}
        >
          <div className="role-icon">🎓</div>
          <h2>Student</h2>
          <p>Mark attendance using face AI</p>
        </div>

      </div>
    </div>
  );
}