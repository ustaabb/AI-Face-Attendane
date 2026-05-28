import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import "../styles/Dashboard.css";

export default function StudentDashboard() {

  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sessions, setSessions] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [summary, setSummary] = useState([]);
  const [student, setStudent] = useState(null);
  const [hoveredSubject, setHoveredSubject] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const loadStudentProfile = async () => {
    const token = localStorage.getItem("student_token");

    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/users/student/profile/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStudent(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  const loadSummary = async () => {
    const token = localStorage.getItem("student_token");

    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/attendance/student-summary/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSummary(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 LOAD SESSIONS
  const loadSessions = async () => {
    const token = localStorage.getItem("student_token");

    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/attendance/get-sessions/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSessions(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStudentProfile();
    loadSessions();
    loadSummary();

    const interval = setInterval(() => {
      loadSessions();
      loadSummary();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 START CAMERA
  const startCamera = async () => {
    if (!videoRef.current.srcObject) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    }
  };

  // 🔥 STOP CAMERA
  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // 🔥 MARK ATTENDANCE
  const markAttendance = async (sessionId) => {

    try {
      setCapturing(true);

      await startCamera();
      await new Promise(r => setTimeout(r, 1500));

      const frames = [];

      for (let i = 0; i < 4; i++) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 640;
        canvas.height = 480;

        ctx.drawImage(videoRef.current, 0, 0, 640, 480);

        const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));
        frames.push(blob);

        await new Promise(r => setTimeout(r,1500));
      }

      const token = localStorage.getItem("student_token");

      const formData = new FormData();
      frames.forEach((f) => formData.append("images", f));

      formData.append("session_id", sessionId);

      console.log("Sending session:", sessionId);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/recognition/face/",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "success") {
        alert("Attendance Marked ✅");
      } else {
        alert(res.data.message || "Face not recognized ❌");
      }

      stopCamera();
      loadSessions();

    } catch (err) {
      console.error(err);

      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Face not recognized ❌");
      }

      stopCamera();

    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Student Panel</h2>

        <div className={`menu-item ${activeTab==="dashboard"?"active":""}`}
          onClick={()=>setActiveTab("dashboard")}>
          Dashboard
        </div>

        <div className={`menu-item ${activeTab==="attendance"?"active":""}`}
          onClick={()=>setActiveTab("attendance")}>
          Attendance
        </div>

        <div className={`menu-item ${activeTab==="profile"?"active":""}`}
          onClick={()=>setActiveTab("profile")}>
          Student Profile
        </div>
      </div>

      {/* CONTENT */}
      <div className="dashboard-content">

        {/* DASHBOARD */}
        {activeTab==="dashboard" && student && (
          <div className="card">
            <h2>Welcome {student.name} 👋</h2>
            <p>{student.department} | {student.className}</p>
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab==="attendance" && (
          <div className="card">

            <h2>Attendance</h2>

            <div className="list-item" style={{fontWeight:"bold"}}>
              <span>Teacher</span>
              <span>Subject</span>
              <span>Total</span>
              <span>Present</span>
              <span>Absent</span>
              <span>Face</span>
              <span>QR</span>
              <span>Attendance(%)</span>
            </div>


              {summary.map((item, index) => {

                const faceSession = sessions.find(
                  (s) =>
                    s.subject === item.subject &&
                    s.is_active &&
                    s.session_type === "face"
                );

                const qrSession = sessions.find(
                  (s) =>
                    s.subject === item.subject &&
                    s.is_active &&
                    s.session_type === "qr"
                );

                return (
                <div key={index} className="list-item"
                onMouseEnter={() => setHoveredSubject(item)}
                onMouseLeave={() => setHoveredSubject(null)}
                onMouseMove={(e) =>
                  setMousePos({ x: e.clientX, y: e.clientY })
                }>

                  <span>{item.teacher}</span>
                  <span>{item.subject}</span>
                  <span>{item.total_lectures}</span>
                  <span>{item.present}</span>
                  <span>{item.absent}</span>

                 <span>
                {/* FACE BUTTON */}
                <button
                  disabled={!faceSession || capturing}
                  className={faceSession ? "btn-active" : "btn-disabled"}
                  onClick={() => faceSession && markAttendance(faceSession.id)}
                >
                  {capturing ? "Capturing..." : "Face"}
                </button>
                </span>

                <span>

                {/* QR BUTTON */}
                <button
                  disabled={!qrSession}
                  className={qrSession ? "btn-active" : "btn-disabled"}
                  onClick={() =>
                    qrSession && navigate(`/mark-qr/${qrSession.id}`)
                  }
                >
                  QR
                </button>
              </span>

                  <span>{item.percentage}%</span>

                </div>
              );
            })}

            {hoveredSubject && (
  <div
    style={{
      position: "fixed",
      top: mousePos.y + 15,
      left: mousePos.x + 15,
      background: "#111827",
      padding: "15px",
      borderRadius: "12px",
      boxShadow: "0 0 20px rgba(0,0,0,0.5)",
      zIndex: 999,
      pointerEvents: "none",
      color: "white"
    }}
  >
    <h4 style={{ textAlign: "center", marginBottom: "10px" }}>
      {hoveredSubject.subject}
    </h4>

    <PieChart width={200} height={200}>
      <Pie
        data={[
          {
            name: "Present",
            value: hoveredSubject.present,
          },
          {
            name: "Absent",
            value: hoveredSubject.absent,
          },
        ]}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius={70}
      >
        <Cell fill="#22c55e" />
        <Cell fill="#ef4444" />
      </Pie>

      <Tooltip />
    </PieChart>

    <p style={{ textAlign: "center" }}>
      {hoveredSubject.percentage}%
    </p>
  </div>
)}

          </div>
        )}

        {/* PROFILE */}
        {activeTab==="profile" && student && (
          <div className="card profile-card">
            <h2>Student Profile</h2>

            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>Father's Name:</strong> {student.father_name}</p>
            <p><strong>University Roll No:</strong> {student.roll}</p>
            <p><strong>Date of Birth:</strong> {student.dob}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Department:</strong> {student.department}</p>
            <p><strong>Class:</strong> {student.className}</p>
            <p><strong>Semester:</strong> {student.semester}</p>  
            
                

            <button onClick={()=>{
              localStorage.removeItem("student_token");
              navigate("/");
            }}>
              Logout
            </button>
          </div>
        )}

      </div>

      <video ref={videoRef} autoPlay width="300" />

    </div>
  );
}