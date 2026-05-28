import { useState, useEffect, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import "../styles/Dashboard.css";

export default function TeacherDashboard() {

  const [activeTab, setActiveTab] = useState("dashboard");

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [semester, setSemester] = useState("");
  const [sessionType, setSessionType] = useState("face");
  const [qrCode, setQrCode] = useState("");

  const [department, setDepartment] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");

  const [teacherData, setTeacherData] = useState({
    departments: [],
    classes: [],
    subjects: [],
    semesters: []
  });

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("teacher_token");

  // 🔥 FETCH TEACHER PROFILE
  const fetchTeacherData = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/users/teacher/profile/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTeacherData(res.data);

      if (res.data.departments.length > 0)
        setDepartment(res.data.departments[0]);

      if (res.data.classes.length > 0)
        setClassName(res.data.classes[0]);

      if (res.data.subjects.length > 0)
        setSubject(res.data.subjects[0]);

      if (res.data.semesters?.length > 0)
      setSemester(res.data.semesters[0]);

    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 🔥 FETCH STUDENTS
  const fetchStudents = useCallback(async (dept, cls) => {
    if (!dept || !cls) return;

    setLoadingStudents(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/attendance/get-students/",
        { department: dept, class_name: cls },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudents(res.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  }, [token]);

  // 🔥 FETCH ACTIVE SESSION (IMPORTANT FIX)
  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/attendance/teacher-dashboard/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const active = res.data.find(s => s.is_active);

      if (active) {
        setSessionActive(true);
        setSessionId(active.session_id);
      } else {
        setSessionActive(false);
        setSessionId(null);
      }

    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTeacherData();
      fetchActiveSession();
    }
  }, [fetchTeacherData, fetchActiveSession, token]);

  useEffect(() => {
    fetchStudents(department, className);
  }, [department, className, fetchStudents]);

  // 🔥 START SESSION
  // 🔥 START SESSION
const startSession = async () => {

  if (!department || !className || !subject || !semester) {
    alert("Please select all fields");
    return;
  }

  setLoading(true);

  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/api/attendance/create-session/",
      { 
        department, 
        class_name: className, 
        subject, 
        semester,
        type: sessionType   // ✅ ADD THIS
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSessionActive(true);
    setSessionId(res.data.session_id);

    // ✅ AUTO GENERATE QR (optional but recommended)
    if (sessionType === "qr") {
      const qrData = `http://localhost:3000/mark-attendance/${res.data.session_id}`;
      setQrCode(qrData);
    }

    alert("Session Started ✅");

  } catch (err) {
    alert(err.response?.data?.error || "Failed to start session");
  } finally {
    setLoading(false);
  }
};


  // 🔥 GENERATE QR
  const generateQR = () => {
    if (!sessionId) {
      alert("Start session first");
      return;
    }

  const qrData = `http://localhost:3000/mark-attendance/${sessionId}`;
  setQrCode(qrData);
};

  // 🛑 STOP SESSION (FINAL FIX)
 // 🛑 STOP SESSION
  const stopSession = async () => {

    if (!sessionId) {
      alert("No active session");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/attendance/stop-session/",
        { session_id: sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSessionActive(false);
      setSessionId(null);

      setQrCode("");   // ✅ IMPORTANT (clear QR)

      alert("Session Stopped ❌");

    } catch (err) {
      alert("Error stopping session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <div className="sidebar">
  <h2>Teacher Panel</h2>

  <div
    className={`menu-item ${activeTab==="dashboard" ? "active" : ""}`}
    onClick={() => setActiveTab("dashboard")}
  >
    Dashboard
  </div>

  <div
    className={`menu-item ${activeTab==="session" ? "active" : ""}`}
    onClick={() => setActiveTab("session")}
  >
    Session
  </div>
</div>

      {/* MAIN CONTENT */}
      <div className="dashboard-content">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <h1>Welcome Teacher 👨‍🏫</h1>

            <div className="card">
              <h3>Session Status</h3>
              <p>
                <strong>
                  {sessionActive ? "🟢 Active" : "🔴 Inactive"}
                </strong>
              </p>
            </div>
          </>
        )}

        {/* SESSION TAB */}
        {activeTab === "session" && (
          <div className="card">

            <h2>Manage Attendance Session</h2>

            {!sessionActive && (
              <>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {teacherData.departments.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>

                <select value={className} onChange={(e) => setClassName(e.target.value)}>
                  {teacherData.classes.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>

                <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                  {(teacherData.semesters || []).map((sem, i) => (
                    <option key={i} value={sem}>Sem {sem}</option>
                  ))}
                </select>

                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {teacherData.subjects.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>

                <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                <option value="face">Face Attendance</option>
                <option value="qr">QR Attendance</option>
              </select>

                <button onClick={startSession} disabled={loading}>
                  {loading ? "Starting..." : "Start Session 🚀"}
                </button>
              </>
            )}

            {sessionActive && (
            <>
            <p style={{ color: "green" }}>Session is ACTIVE ✅</p>

            {/* 🔥 QR UI */}
            {sessionType === "qr" && (
              <div style={{ marginTop: "20px" }}>

                {qrCode && (
                  <div style={{ marginTop: "20px" }}>
                    <QRCodeCanvas value={qrCode} size={200} />
                    <p>Scan to mark attendance</p>
                  </div>
                )}

              </div>
            )}

            <button
              onClick={stopSession}
              disabled={loading}
              style={{ backgroundColor: "red", color: "white" }}
            >
              {loading ? "Stopping..." : "Stop Session ❌"}
            </button>
          </>
        )}

            {/* STUDENTS */}
            <div style={{ marginTop: "20px" }}>
              <h3>Students</h3>

              {loadingStudents ? (
                <p>Loading students...</p>
              ) : students.length === 0 ? (
                <p>No students found</p>
              ) : (
               <div className="attendance-table">

  <div className="list-item list-header">
    <span>Name</span>
    <span>Roll</span>
    <span>Email</span>
    <span>Department</span>
    <span>Class</span>
    <span>Semester</span>
  </div>

  {students.map((s) => (
    <div key={s.id} className="list-item">
      <span>{s.name}</span>
      <span>{s.roll}</span>
      <span>{s.email}</span>
      <span>{s.department}</span>
      <span>{s.class_name}</span>
      <span>{s.semester}</span>
    </div>
  ))}

</div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}