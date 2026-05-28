import { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export default function AdminDashboard() {

  const token = localStorage.getItem("admin_token");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [teacherView, setTeacherView] = useState("list"); // default list
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [toast, setToast] = useState("");
  const [studentView, setStudentView] = useState("list");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
  department: "",
  semester: "",
});

const navigate = useNavigate();
useEffect(() => {
  axios.get("http://127.0.0.1:8000/api/users/departments/")
    .then(res => setDepartments(res.data))
    .catch(err => console.error(err));
}, []);

useEffect(() => {
  const token = localStorage.getItem("admin_token");
  const role = localStorage.getItem("admin_role");

  if (!token || role !== "admin") {
    navigate("/admin-login");
  }
}, [navigate]);

const fetchStudentReport = async () => {
  if (!filters.department || !filters.semester ) {
    alert("Select all filters");
    return;
  }

  try {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/attendance/student-subject-report/",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters },
    );

    setStudentReport(res.data);
  } catch (err) {
    console.error(err);
  }
};

const [studentReport, setStudentReport] = useState([]);
const [selectedRow, setSelectedRow] = useState(null);

const [student, setStudent] = useState({
  name: "",
  email: "",
  department: "",
  class_name: "",
  semester: "",
});

const handleSelectStudent = (id) => {
  setSelectedStudents(prev =>
    prev.includes(id)
      ? prev.filter(s => s !== id)
      : [...prev, id]
  );
};

const handleSelectAllStudents = () => {
  if (selectedStudents.length === students.length) {
    setSelectedStudents([]);
  } else {
    setSelectedStudents(students.map(s => s.id));
  }
};

const handleBulkDeleteStudents = async () => {
  if (selectedStudents.length === 0) return;

  if (!window.confirm(`Delete ${selectedStudents.length} students?`)) return;

  try {
    await Promise.all(
      selectedStudents.map(id =>
        axios.delete(`http://127.0.0.1:8000/api/users/student/${id}/`)
      )
    );

    setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
    setSelectedStudents([]);

    showToast("Students deleted ✅");

  } catch (err) {
    showToast("Delete failed ❌");
  }
};

const handleUpdateStudent = async () => {
  if (!selectedStudent) {
    alert("Select a student first");
    return;
  }

  try {
    await axios.put(
      `http://127.0.0.1:8000/api/users/student/${selectedStudent.id}/`,
      student
    );

    alert("Student Updated ✅");
    fetchStudents();
    setStudentView("list");

  } catch (err) {
    alert("Update failed");
  }
};

const showToast = (msg) => {
  setToast(msg);
  setTimeout(() => setToast(""), 3000);
};

  const handleSelectAll = () => {
  if (selectedTeachers.length === teachers.length) {
    setSelectedTeachers([]);
  } else {
    setSelectedTeachers(teachers.map(t => t.id));
  }
};

  const handleSelectTeacher = (id) => {
  setSelectedTeachers(prev =>
    prev.includes(id)
      ? prev.filter(t => t !== id)
      : [...prev, id]
  );
};

  const handleBulkDelete = async () => {
  if (selectedTeachers.length === 0) return;

  if (!window.confirm(`Delete ${selectedTeachers.length} teachers?`)) return;

  try {
    await Promise.all(
      selectedTeachers.map(id =>
        axios.delete(`http://127.0.0.1:8000/api/users/teacher/${id}/`)
      )
    );

    // 🔥 REMOVE FROM UI INSTANTLY
    setTeachers(prev => prev.filter(t => !selectedTeachers.includes(t.id)));

    setSelectedTeachers([]);

    showToast("Deleted successfully ✅");

  } catch (err) {
    showToast("Delete failed ❌");
  }
};
  const handleUpdateTeacher = async () => {
  if (!selectedTeacher) {
    alert("Select a teacher first");
    return;
  }

  try {
    await axios.put(
      `http://127.0.0.1:8000/api/users/teacher/${selectedTeacher.id}/`,
      teacher
    );

    alert("Teacher Updated ✅");
    fetchTeachers();
    setTeacherView("list");

  } catch (err) {
    alert("Update failed");
  }
};

  const handleDeleteTeacher = async (id) => {
  if (!window.confirm("Are you sure?")) return;

  try {
    await axios.delete(
      `http://127.0.0.1:8000/api/users/teacher/${id}/`
    );

    alert("Teacher Deleted ❌");
    fetchTeachers();

  } catch (err) {
    alert("Delete failed");
  }
};

  const [teacher, setTeacher] = useState({
    name: "",
    email: "",
    password: "123",
    department: "",
    class_name: "",
    subject: "",
    semester: "",
    qualifications: "",
  });

  

  const [teachers, setTeachers] = useState([]);

  const [students, setStudents] = useState([]);

  // 🔥 FETCH STUDENTS
    const fetchStudents = async () => {
    try {
        const res = await axios.get("http://127.0.0.1:8000/api/users/students/",
          {
        headers: { Authorization: `Bearer ${token}` }
      }
        );
        setStudents(res.data);
    } catch (err) {
        console.error("Fetch students error:", err);
    }
    };

  // 🔥 FETCH TEACHERS
  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/users/teachers/",
        {
        headers: { Authorization: `Bearer ${token}` }
      }
      );
      setTeachers(res.data);
    } catch (err) {
      console.error("Fetch teachers error:", err);
    }
  };

  //fetch for admin 
const fetchAttendance = async () => {

  // ✅ Only run when BOTH selected
  if (!department || !semester) return;

  try {

    const res = await axios.get(
      "http://127.0.0.1:8000/api/attendance/admin-view/",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          department: department,
          semester: semester
        },     
      },
    );

    console.log("API DATA:", res.data);

    // ✅ Always set array safely
    setAttendance(res.data || []);

  } catch (err) {
    console.error("Fetch Error:", err);
  }
};  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);

  // 🔹 HANDLE INPUT
  const handleChange = (e) => {
    setTeacher({ ...teacher, [e.target.name]: e.target.value });
  };

  // 🔥 ADD TEACHER
  const handleAddTeacher = async () => {

    if (!teacher.name || !teacher.email || !teacher.department || !teacher.class_name || !teacher.subject) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/users/teacher/register/",
        teacher
      );

      alert("Teacher Added Successfully ✅");

      fetchTeachers();

      // 🔄 RESET FORM
      setTeacher({
        name: "",
        email: "",
        password: "123",
        department: "",
        class_name: "",
        subject: "",
        semester: "",
        qualifications: "",
      });

    } catch (err) {
      alert(err.response?.data?.error || "Error adding teacher");
    }
  };

  const allSubjects = [
  ...new Set(
    studentReport.flatMap((s) =>
      s.subjects.map((sub) => sub.subject)
    )
  )
];

  return (
    <div className="dashboard-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Admin Panel</h2>

        <div
          className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </div>

        <div
            className={`menu-item ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
            >
            Students
        </div>

        <div
          className={`menu-item ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Teacher
        </div>
      </div>

      {/* CONTENT */}
      <div className="dashboard-content">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
      <div className="card">
  <h2>📊 Attendance Dashboard</h2>

  {/* FILTERS */}
  <div className="filter-row">
   <select onChange={(e) => setDepartment(e.target.value)}>
  <option value="">Select Department</option>

  {departments.map((dep, i) => (
    <option key={i} value={dep}>
      {dep.toUpperCase()}
    </option>
  ))}
</select>

<select onChange={(e) => setSemester(e.target.value)}>
  <option value="">Select Semester</option>
  {[1,2,3,4,5,6,7,8].map(sem => (
    <option key={sem} value={sem}>Sem {sem}</option>
  ))}
</select>

<button onClick={fetchAttendance}>View</button>

  </div>

  {/* TABLE */}
  <div className="attendance-table">
    <div className="list-item list-header">
      <span>Name</span>
      <span>Email</span>
      <span>Roll</span>
      <span>Department</span>
      <span>Semester</span>
      <span>Overall Attendance %</span>
    </div>

    {attendance.map((a,i) => (
      <div key={i} className="list-item"
      onMouseEnter={() => {
      setTimeout(() => setHoveredStudent(a), 100);
      }}
      onMouseLeave={() => setHoveredStudent(null)}
      onMouseMove={(e) =>
      setMousePos({ x: e.clientX, y: e.clientY })
      }
      >
  <span>{a.name || "N/A"}</span>
  <span>{a.email || "N/A"}</span>   {/* ✅ ADD THIS */}
  <span>{a.roll_number}</span>
  <span>{a.department}</span>
  <span>{a.semester}</span>
  <span>{a.percentage} %</span>
</div>
    ))}
  </div>

  {hoveredStudent && (
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
      {hoveredStudent.name}
    </h4>

    <PieChart width={200} height={200}>
      <Pie
        data={[
          {
            name: "Present",
            value: Number(hoveredStudent.percentage),
          },
          {
            name: "Absent",
            value: 100 - Number(hoveredStudent.percentage),
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
      {hoveredStudent.percentage}%
    </p>
  </div>
)}

  </div>
    )}

        {/* 🔥 STUDENT SECTION */}
        {activeTab === "students" && (
    <div className="card">
    <div className="teacher-topbar">

  <div
    className={`top-item ${studentView === "list" ? "active-top" : ""}`}
    onClick={() => setStudentView("list")}
  >
    Student List
  </div>

  <div
    className={`top-item ${studentView === "update" ? "active-top" : ""}`}
    onClick={() => setStudentView("update")}
  >
    Update
  </div>

  <div
    className={`top-item ${studentView === "delete" ? "active-top" : ""}`}
    onClick={() => setStudentView("delete")}
  >
    Delete
  </div>

</div>

{studentView === "list" && (
  <>
    <h3>Student Attendance Report</h3>

    {/* 🔥 FILTERS */}
    <div className="filter-row">
      <select
  onChange={(e) =>
    setFilters({ ...filters, department: e.target.value })
  }
>
  <option value="">Select Department</option>

  {departments.map((dep, i) => (
    <option key={i} value={dep}>
      {dep.toUpperCase()}
    </option>
  ))}
</select>

      <select
        onChange={(e) =>
          setFilters({ ...filters, semester: e.target.value })
        }
      >
        <option value="">Semester</option>
        {[1,2,3,4,5,6,7,8].map((s) => (
          <option key={s} value={s}>Sem {s}</option>
        ))}
      </select>

      <button onClick={fetchStudentReport}>Load</button>
    </div>

    {/* 🔥 HEADER */}
    <div className="list-item list-header">
  <span>Roll</span>
  <span>Name</span>

  {allSubjects.map((sub, i) => (
    <span key={i}>{sub}</span>
  ))}
</div>

    {/* 🔥 DATA */}
    {studentReport.map((s) => (
      <div
        key={s.id}
        className="list-item"
        onClick={() => setSelectedRow(s)}
        style={{ cursor: "pointer" }}
      >
        <span>{s.roll}</span>
        <span>{s.name}</span>

        {allSubjects.map((subjectName, i) => {
  const found = s.subjects.find(
    (sub) => sub.subject === subjectName
  );

  return (
    <span key={i}>
      {found ? `${found.attended}/${found.total}` : "0/0"}
    </span>
  );
})}
      </div>
    ))}
  </>
)}

{studentView === "list" && selectedRow && (
  <div className="form-group" style={{ marginTop: "20px" }}>
    <h3>Edit Attendance - {selectedRow.name}</h3>

    {selectedRow.subjects.map((sub, i) => (
      <div key={i} style={{ marginBottom: "10px" }}>
        <b>{sub.subject}</b>

        <div>
          <input
            type="number"
            value={sub.attended}
            onChange={(e) => {
              const updated = [...selectedRow.subjects];
              updated[i].attended = Number(e.target.value);
              setSelectedRow({ ...selectedRow, subjects: updated });
            }}
            style={{ width: "60px", marginRight: "5px" }}
          />

          /

          <input
            type="number"
            value={sub.total}
            onChange={(e) => {
              const updated = [...selectedRow.subjects];
              updated[i].total = Number(e.target.value);
              setSelectedRow({ ...selectedRow, subjects: updated });
            }}
            style={{ width: "60px", marginLeft: "5px" }}
          />
        </div>
      </div>
    ))}

    <button
      onClick={async () => {
        try {
          for (let sub of selectedRow.subjects) {
            await axios.post(
              "http://127.0.0.1:8000/api/attendance/update-subject-attendance/",
              {
                student_id: selectedRow.id,
                subject: sub.subject,
                attended: sub.attended,
                total: sub.total
              }
            );
          }

          alert("Updated Successfully ✅");
          fetchStudentReport();
          setSelectedRow(null);

        } catch (err) {
          alert("Update failed ❌");
        }
      }}
    >
      Save Changes
    </button>
  </div>
)}

{studentView === "update" && (
  <>
    <h3>Select Student to Update</h3>

    {/* ✅ FULL HEADER */}
    <div className="list-item list-header">
      <span>Name</span>
      <span>Roll</span>
      <span>DOB</span>
      <span>Email</span>
      <span>Father</span>
      <span>Department</span>
      <span>Class</span>
      <span>Semester</span>
    </div>

    {/* ✅ SINGLE STUDENT LIST */}
    {students.map((s) => (
      <div
        key={s.id}
        className={`list-item ${
          selectedStudent?.id === s.id ? "selected-row" : ""
        }`}
        onClick={() => {
          setSelectedStudent(s);
          setStudent(s); // autofill form
        }}
      >
        <span>{s.name || "N/A"}</span>
        <span>{s.roll_number}</span>
        <span>{s.dob}</span>
        <span>{s.email}</span>
        <span>{s.father_name}</span>
        <span>{s.department}</span>
        <span>{s.class_name}</span>
        <span>{s.semester}</span>
      </div>
    ))}

    {/* ✅ UPDATE FORM */}
    {selectedStudent && (
      <div className="form-group" style={{ marginTop: "20px" }}>
        <h3>Update Student</h3>

        <input
          name="name"
          value={student.name || ""}
          onChange={(e) =>
            setStudent({ ...student, name: e.target.value })
          }
        />

        <input
          name="roll_number"
          value={student.roll_number || ""}
          onChange={(e) =>
            setStudent({ ...student, roll_number: e.target.value })
          }
        />

        <input
          name="dob"
          value={student.dob || ""}
          onChange={(e) =>
            setStudent({ ...student, dob: e.target.value })
          }
        />

        <input
          name="email"
          value={student.email || ""}
          onChange={(e) =>
            setStudent({ ...student, email: e.target.value })
          }
        />

        <input
          name="father_name"
          value={student.father_name || ""}
          onChange={(e) =>
            setStudent({ ...student, father_name: e.target.value })
          }
        />

        <input
          name="department"
          value={student.department || ""}
          onChange={(e) =>
            setStudent({ ...student, department: e.target.value })
          }
        />

        <input
          name="class_name"
          value={student.class_name || ""}
          onChange={(e) =>
            setStudent({ ...student, class_name: e.target.value })
          }
        />

        <input
          name="semester"
          value={student.semester || ""}
          onChange={(e) =>
            setStudent({ ...student, semester: e.target.value })
          }
        />

        <button onClick={handleUpdateStudent}>
          Update Student
        </button>
      </div>
    )}
  </>
)}

{studentView === "delete" && (
  <>
    <h3>Delete Students ({selectedStudents.length})</h3>

    {/* 🔥 HEADER */}
    <div className="list-item list-header">
      <span>
        <input
          type="checkbox"
          checked={selectedStudents.length === students.length}
          onChange={handleSelectAllStudents}
        />
      </span>
      <span>Name</span>
      <span>Roll</span>
      <span>DOB</span>
      <span>Email</span>
      <span>Department</span>
      <span>Class</span>
      <span>Semester</span>
    </div>

    {/* 🔥 DATA */}
    {students.map((s) => (
      <div key={s.id} className="list-item">
        <span>
          <input
            type="checkbox"
            checked={selectedStudents.includes(s.id)}
            onChange={() => handleSelectStudent(s.id)}
          />
        </span>

        <span>{s.name || "N/A"}</span>
        <span>{s.roll_number}</span>
        <span>{s.dob}</span>
        <span>{s.email}</span>
        <span>{s.department}</span>
        <span>{s.class_name}</span>
        <span>{s.semester}</span>
      </div>
    ))}

    {/* 🔥 DELETE BUTTON */}
    <button
      disabled={selectedStudents.length === 0}
      onClick={handleBulkDeleteStudents}
      style={{
        marginTop: "20px",
        width: "100%",
        background: selectedStudents.length === 0 ? "#555" : "red",
        opacity: selectedStudents.length === 0 ? 0.6 : 1,
        cursor: selectedStudents.length === 0 ? "not-allowed" : "pointer"
      }}
    >
      Delete Selected ({selectedStudents.length})
    </button>
  </>
)}

      </div>
    )}

        {/* TEACHER SECTION */}
        {activeTab === "teachers" && (
  <div className="card">

    {/* <h2>Teacher Management</h2> */}

    {/* 🔥 TOP BAR */}
   <div className="teacher-topbar">

  <div
    className={`top-item ${teacherView === "list" ? "active-top" : ""}`}
    onClick={() => setTeacherView("list")}
  >
    Teacher List
  </div>

  <div
    className={`top-item ${teacherView === "add" ? "active-top" : ""}`}
    onClick={() => setTeacherView("add")}
  >
    Add
  </div>

  <div
    className={`top-item ${teacherView === "update" ? "active-top" : ""}`}
    onClick={() => setTeacherView("update")}
  >
    Update
  </div>

  <div
    className={`top-item ${teacherView === "delete" ? "active-top" : ""}`}
    onClick={() => setTeacherView("delete")}
  >
    Delete
  </div>

</div>

    {/* 🔥 CONTENT AREA */}

    {teacherView === "update" && (
  <>
    <h3>Select Teacher to Update</h3>

    {/* 🔥 SELECT LIST */}
    <div className="list-item list-header">
      <span>Name</span>
      <span>Email</span>
      <span>Department</span>
      <span>Class</span>
      <span>Subject</span>
      <span>Semester</span>
    </div>

    {teachers.map((t) => (
      <div
        key={t.id}
        className={`list-item ${selectedTeacher?.id === t.id ? "selected-row" : ""}`}
        onClick={() => {
          setSelectedTeacher(t);
          setTeacher(t);
        }}
      >
        <span>{t.name}</span>
        <span>{t.email}</span>
        <span>{t.department}</span>
        <span>{t.class_name}</span>
        <span>{t.subject}</span>
        <span>{t.semester}</span>
      </div>
    ))}

    {/* 🔥 FORM */}
    {selectedTeacher && (
      <div className="form-group" style={{ marginTop: "20px" }}>
        <h3>Update Teacher</h3>

        <input name="name" value={teacher.name} onChange={handleChange}/>
        <input name="email" value={teacher.email} onChange={handleChange}/>
        <input name="department" value={teacher.department} onChange={handleChange}/>
        <input name="class_name" value={teacher.class_name} onChange={handleChange}/>
        <input name="subject" value={teacher.subject} onChange={handleChange}/>
        <input name="semester" value={teacher.semester} onChange={handleChange}/>

        <button onClick={handleUpdateTeacher}>
          Update Teacher
        </button>
      </div>
    )}
  </>
)}

    {teacherView === "delete" && (
  <>
    <h3>
      Delete Teachers ({selectedTeachers.length} selected)
    </h3>

    <div className="list-item list-header">
      <span>
        <input
          type="checkbox"
          checked={selectedTeachers.length === teachers.length}
          onChange={handleSelectAll}
        />
      </span>
      <span>Name</span>
      <span>Email</span>
      <span>Department</span>
      <span>Class</span>
      <span>Subject</span>
      <span>Semester</span>
    </div>

    {teachers.map((t) => (
      <div key={t.id} className="list-item">
        <span>
          <input
            type="checkbox"
            checked={selectedTeachers.includes(t.id)}
            onChange={() => handleSelectTeacher(t.id)}
          />
        </span>

        <span>{t.name}</span>
        <span>{t.email}</span>
        <span>{t.department}</span>
        <span>{t.class_name}</span>
        <span>{t.subject}</span>
        <span>{t.semester}</span>
      </div>
    ))}

    <button
      disabled={selectedTeachers.length === 0}
      onClick={handleBulkDelete}
      style={{
        marginTop: "20px",
        width: "100%",
        background: selectedTeachers.length === 0 ? "#555" : "red",
        opacity: selectedTeachers.length === 0 ? 0.6 : 1,
        cursor: selectedTeachers.length === 0 ? "not-allowed" : "pointer"
      }}
    >
      Delete Selected ({selectedTeachers.length})
    </button>
  </>
)}

    {/* ✅ LIST (DEFAULT) */}
    {teacherView === "list" && (
      <>
        <h3>Teacher List</h3>

        <div className="list-item list-header">
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Class</span>
          <span>Subject</span>
          <span>Semester</span>
        </div>
      

        {teachers.map((t) => (
  <div 
    key={t.id} 
    className="list-item"
    onClick={() => {
      setSelectedTeacher(t);
      setTeacher(t);          // autofill form
      setTeacherView("update");
    }}
  >
    <span>{t.name}</span>
    <span>{t.email}</span>
    <span>{t.department}</span>
    <span>{t.class_name}</span>
    <span>{t.subject}</span>
    <span>{t.semester}</span>

  </div>
))}
      </>
    )}

    {/* ✅ ADD */}
    {teacherView === "add" && (
      <div className="form-group">
        <input name="name" placeholder="Name" value={teacher.name} onChange={handleChange}/>
        <input name="email" placeholder="Email" value={teacher.email} onChange={handleChange}/>
        <input name="password" placeholder="Password" value={teacher.password} onChange={handleChange}/>
        <input name="department" placeholder="Department" value={teacher.department} onChange={handleChange}/>
        <input name="class_name" placeholder="Class" value={teacher.class_name} onChange={handleChange}/>
        <input name="subject" placeholder="Subject" value={teacher.subject} onChange={handleChange}/>
        <input name="semester" placeholder="Semester" value={teacher.semester} onChange={handleChange}/>
        <input name="qualifications" placeholder="Qualifications" value={teacher.qualifications} onChange={handleChange}/>
        
        <button onClick={handleAddTeacher}>Add Teacher</button>
      </div>
    )}

    {/* ✅ UPDATE */}
    {teacherView === "update" && (
      <div>
        <p>Select teacher to update (coming next step)</p>
      </div>
    )}

    {/* ✅ DELETE */}
    {teacherView === "delete" && (
      <div>
        <p>Select teacher to delete (coming next step)</p>
      </div>
    )}

  </div>
)}

      </div>
    </div>
  );
}
