import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "../styles/Register.css";

function Register() {

const webcamRef = useRef(null);
const [role, setRole] = useState("student");
const [frames, setFrames] = useState([]);

const [formData, setFormData] = useState({
  email: "",
  password: "",
  name: "",
  dob: "",
  father_name: "",
  semester: "",
  class_name: "",
  university_roll_no: "",
  department: ""
});

// 🔥 LIVE CAPTURE
const capture = async () => {

  if (!webcamRef.current || !webcamRef.current.video) {
    alert("Camera not ready");
    return;
  }

  // wait camera ready
  await new Promise(r => setTimeout(r, 1000));

  alert("⚠️ Adjust your face properly in camera, then click OK");

  const capturedFrames = [];

  // 🔥 capture 6 frames (better stability)
  for (let i = 0; i < 6; i++) {

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc || !imageSrc.includes("data:image")) {
      alert("Camera error");
      return;
    }

    const res = await fetch(imageSrc);
    const blob = await res.blob();

    if (blob.size === 0) {
      alert("Invalid image captured");
      return;
    }

    capturedFrames.push(blob);

    await new Promise(r => setTimeout(r, 1800));
  }

  setFrames(capturedFrames);
  alert("Live capture successful ✅");
};

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const handleSubmit = async (e) => {

  e.preventDefault();

  if (!formData.email || !formData.password || !formData.name) {
    alert("Please fill required fields");
    return;
  }

  const data = new FormData();

  data.append("email", formData.email);
  data.append("password", formData.password);
  data.append("name", formData.name);

  if (role === "student") {

    data.append("dob", formData.dob);
    data.append("father_name", formData.father_name);
    data.append("class_name", formData.class_name);
    data.append("semester", Number(formData.semester));
    data.append("university_roll_no", formData.university_roll_no);
    data.append("department", formData.department);

    // 🔥 MULTIPLE FRAMES (FIXED)
    if (frames.length >= 4) {

      // send only first 4 frames
      for (let i = 0; i < 4; i++) {
        data.append("images", frames[i], `frame${i}.jpg`);
      }

    } else {
      alert("Capture at least 4 live face frames");
      return;
    }
  }

  try {

    const response = await axios.post(
      "http://127.0.0.1:8000/api/users/register/",
      data
    );

    console.log(response.data);
    alert("Registration Successful");

  } catch (error) {

    console.error("Register error:", error.response?.data || error.message);

    alert(
      error.response?.data?.error ||
      "Registration failed. Check console."
    );
  }
};

return (

<div className="student-register-container">

<h2>Register</h2>

<form onSubmit={handleSubmit}>

<select value={role} onChange={(e) => setRole(e.target.value)}>
<option value="student">Student</option>
</select>

<input name="email" placeholder="Email" onChange={handleChange} />
<input name="password" type="password" placeholder="Password" onChange={handleChange} />
<input name="name" placeholder="Name" onChange={handleChange} />

{role === "student" && (
<>
<input type="date" name="dob" onChange={handleChange} />
<input name="father_name" placeholder="Father Name" onChange={handleChange} />
<input name="semester" placeholder="Semester (eg.8th)" onChange={handleChange} />
<input name="class_name" placeholder="Class/Section (eg.cse-1 or BA)" onChange={handleChange} />
<input name="department" placeholder="Department (eg.CSE or BA)" onChange={handleChange} />
<input name="university_roll_no" placeholder="University Roll No" onChange={handleChange} />

<div className="webcam-container">

<Webcam
  audio={false}
  ref={webcamRef}
  screenshotFormat="image/jpeg"
  videoConstraints={{
    width: 320,
    height: 240,
    facingMode: "user"
  }}
/>

<p style={{color: "yellow"}}>
  ⚠️ Make sure your face is clearly visible before capture
</p>

</div>

<button type="button" onClick={capture}>
Capture Photo
</button>

{frames.length > 0 && (
<p>Live capture done ✅</p>
)}

</>
)}

<button type="submit" className="submit-btn">
Register
</button>

</form>

</div>
);
}

export default Register;