import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import axios from "axios";

export default function QRScanPage() {

  const { id } = useParams();
  const sessionId = id;
  const navigate = useNavigate();
  const token = localStorage.getItem("student_token");
  const location = useLocation(); // (kept, but not used here)

  useEffect(() => {

    if (!sessionId) {
      alert("Session ID missing ❌");
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const res = await axios.post(
            "http://127.0.0.1:8000/api/attendance/mark-qr-attendance/",
            {
              session_id: sessionId,
              qr_data: decodedText
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          console.log("Attendance marked ✅");

          await scanner.clear();

          // small delay for smooth navigation
          setTimeout(() => {
            navigate("/StudentDashboard", {
              state: { tab: "attendance", success: true }
            });
          }, 300);

        } catch (err) {
          alert(err.response?.data?.error || "QR Failed ❌");
        }
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, [sessionId, token, navigate]);

  // 🔥 IMAGE UPLOAD QR
  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!sessionId) {
      alert("Session ID missing ❌");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("session_id", sessionId);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/attendance/scan-upload/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(res.data.message);

      navigate("/StudentDashboard", {
        state: { tab: "attendance", success: true }
      });

    } catch (err) {
      alert(err.response?.data?.error || "Upload failed ❌");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Scan QR for Attendance 📷</h2>

      {/* CAMERA SCANNER */}
      <div id="reader" style={{ width: "300px", margin: "auto" }}></div>

      <br />

      {/* UPLOAD BUTTON */}
      <label className="btn-active">
        Upload QR 📷
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          hidden
        />
      </label>
    </div>
  );
}