import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import FaceAttendance from "./components/FaceAttendance";
import StudentDashboard from "./components/StudentDashboard";
import TeacherLogin from "./components/TeacherLogin";
import TeacherDashboard from "./components/TeacherDashboard";
import Dashboard from "./components/Dashboard";
// import Register if you have it
import Register from "./components/Register";
import RoleSelect from "./components/RoleSelet";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import QRScanPage from "./components/QRScanPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/mark-qr/:id" element={<QRScanPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/face-attendance" element={<FaceAttendance />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/StudentDashboard" element={<StudentDashboard />} />
         <Route path="/teacher-login" element={<TeacherLogin />} />
         <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  );
  
}

export default App;