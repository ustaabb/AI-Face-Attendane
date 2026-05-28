import { useRef } from "react";
import axios from "axios";

function FaceAttendance() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // 🔥 LIVENESS + ATTENDANCE
  const markAttendance = async () => {

    const studentId = localStorage.getItem("student_id");

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    const formData = new FormData();

    formData.append("roll", studentId);
    formData.append("mode", "FACE");

    // 🔥 Capture 3 frames (LIVENESS)
    for (let i = 0; i < 3; i++) {

      context.drawImage(video, 0, 0, 300, 200);

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      formData.append("images", blob, `frame${i}.jpg`);

      await new Promise(r => setTimeout(r, 500));
    }

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/api/mark-attendance/",
        formData
      );

      alert(response.data.message || response.data.error);

    } catch (error) {
      console.error(error);
      alert("Attendance failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>

      <h2>Face Attendance</h2>

      <video ref={videoRef} autoPlay width="300" />

      <br /><br />

      <button onClick={startCamera}>Start Camera</button>

      <br /><br />

      <button onClick={markAttendance}>Mark Attendance</button>

      <canvas ref={canvasRef} width="300" height="200" style={{ display: "none" }} />

    </div>
  );
}

export default FaceAttendance;