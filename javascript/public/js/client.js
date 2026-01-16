const token = localStorage.getItem("token");
if (!token) window.location.href = "/index.html";

let currentUser = null;
let ws = null;
let currentClassStudents = []; // For teacher
let activeClassId = null;

// DOM Elements
const teacherControls = document.getElementById("teacher-controls");
const studentControls = document.getElementById("student-controls");
const sessionStats = document.getElementById("session-stats");
const studentListContainer = document.getElementById("student-list-container");
const studentList = document.getElementById("student-list");
const sessionStatus = document.getElementById("session-status");
const endSessionBtn = document.getElementById("end-session-btn");

// Init
async function init() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": token }
    });
    const data = await res.json();
    if (!data.success) throw new Error();
    
    currentUser = data.data;
    document.getElementById("user-name").textContent = `${currentUser.name} (${currentUser.role})`;
    document.getElementById("role-title").textContent = `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard`;

    if (currentUser.role === "teacher") {
      teacherControls.classList.remove("hidden");
      studentListContainer.classList.remove("hidden");
    } else {
      studentControls.classList.remove("hidden");
      document.getElementById("student-view-msg").classList.remove("hidden");
    }

    connectWS();

  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
  }
}

// WebSocket
function connectWS() {
  ws = new WebSocket(`ws://${location.host}/ws?token=${token}`);

  ws.onopen = () => {
    console.log("Connected to WS");
    sessionStatus.textContent = "Connected to Live Server";
    sessionStatus.style.color = "#03dac6";
    
    // If student, check status immediately
    if (currentUser.role === "student") {
        ws.send(JSON.stringify({ event: "MY_ATTENDANCE" }));
    }
  };

  ws.onmessage = (event) => {
    const { event: eventName, data } = JSON.parse(event.data);
    
    if (eventName === "ATTENDANCE_MARKED") {
      handleAttendanceMarked(data);
    } else if (eventName === "TODAY_SUMMARY") {
      updateStats(data);
    } else if (eventName === "MY_ATTENDANCE") {
      updateMyStatus(data);
    } else if (eventName === "DONE") {
      alert(`Session Ended. Present: ${data.present}, Absent: ${data.absent}`);
      resetSessionUI();
    } else if (eventName === "ERROR") {
      console.error("WS Error:", data.message);
      // alert(data.message); // Optional
    }
  };

  ws.onclose = () => {
    sessionStatus.textContent = "Disconnected";
    sessionStatus.style.color = "#cf6679";
  };
}

// Logic
function handleAttendanceMarked({ studentId, status }) {
  if (currentUser.role === "teacher") {
    const item = document.getElementById(`student-${studentId}`);
    if (item) {
        const badge = item.querySelector(".status-badge");
        badge.className = `status-badge status-${status}`;
        badge.textContent = status;
    }
    // Update stats locally or request summary? 
    // Teacher should request summary to keep sync? 
    // Or server sends summary automatically? Spec says "Event 2: TODAY_SUMMARY... Teacher Sends... Broadcast".
    // So we should trigger summary update after marking.
    ws.send(JSON.stringify({ event: "TODAY_SUMMARY" }));
  } else if (currentUser.role === "student" && currentUser._id === studentId) {
      updateMyStatus({ status });
  }
}

function updateStats({ present, absent, total }) {
  sessionStats.classList.remove("hidden");
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-present").textContent = present;
  document.getElementById("stat-absent").textContent = absent;
}

function updateMyStatus({ status }) {
    const badge = document.getElementById("student-status-badge");
    badge.className = `status-badge status-${status || 'pending'}`;
    badge.textContent = status || "Waiting...";
}

function resetSessionUI() {
    activeClassId = null;
    endSessionBtn.classList.add("hidden");
    sessionStats.classList.add("hidden");
    studentList.innerHTML = "";
    document.getElementById("start-session-btn").classList.remove("hidden");
    if (currentUser.role === "student") {
        updateMyStatus({ status: null });
    }
}

// Teacher Actions
if (document.getElementById("create-class-btn")) {
    document.getElementById("create-class-btn").addEventListener("click", async () => {
        const name = document.getElementById("new-class-name").value;
        if (!name) return alert("Enter class name");

        const res = await fetch("/api/class", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ className: name })
        });
        const d = await res.json();
        if(d.success) {
            alert(`Class Created! ID: ${d.data._id}`);
            document.getElementById("class-id-input").value = d.data._id;
        } else {
            alert(d.error);
        }
    });
}

if (document.getElementById("start-session-btn")) {
    document.getElementById("start-session-btn").addEventListener("click", async () => {
        const classId = document.getElementById("class-id-input").value;
        if (!classId) return alert("Enter Class ID");

        // 1. Fetch Students
        const resStats = await fetch(`/api/class/${classId}`, {
             headers: { "Authorization": token }
        });
        const dStats = await resStats.json();
        
        if (!dStats.success) return alert(dStats.error);
        
        currentClassStudents = dStats.data.students;
        renderStudentList();

        // 2. Start Session (HTTP)
        const resStart = await fetch("/api/attendance/start", {
            method: "POST",
             headers: { "Content-Type": "application/json", "Authorization": token },
             body: JSON.stringify({ classId })
        });
        const dStart = await resStart.json();

        if (dStart.success) {
            activeClassId = classId;
            document.getElementById("start-session-btn").classList.add("hidden");
            endSessionBtn.classList.remove("hidden");
            sessionStats.classList.remove("hidden");
            // Initial Summary
            ws.send(JSON.stringify({ event: "TODAY_SUMMARY" }));
        } else {
            alert(dStart.error);
        }
    });
}

if (endSessionBtn) {
    endSessionBtn.addEventListener("click", () => {
        ws.send(JSON.stringify({ event: "DONE" }));
    });
}

if (document.getElementById("add-student-btn")) {
    document.getElementById("add-student-btn").addEventListener("click", async () => {
        const classId = document.getElementById("class-id-input").value;
        const studentId = document.getElementById("student-id-input").value;
        
        if (!classId || !studentId) return alert("Class ID and Student ID required");

        const res = await fetch(`/api/class/${classId}/add-student`, {
             method: "POST",
             headers: { "Content-Type": "application/json", "Authorization": token },
             body: JSON.stringify({ studentId })
        });
        const d = await res.json();
        if (d.success) {
            alert("Student added!");
            // Determine if we need to refresh list
            if (activeClassId === classId) {
                // Ideally refresh list
                const sRes = await fetch(`/api/class/${classId}`, { headers: { "Authorization": token } });
                const sData = await sRes.json();
                if (sData.success) {
                    currentClassStudents = sData.data.students;
                    renderStudentList();
                }
            }
        } else {
            alert(d.error);
        }
    });
}

function renderStudentList() {
    studentList.innerHTML = "";
    currentClassStudents.forEach(s => {
        const li = document.createElement("li");
        li.id = `student-${s._id}`;
        li.innerHTML = `
            <span>${s.name} <small style="color:#aaa">(${s.email})</small></span>
            <div>
                <span class="status-badge status-pending">Pending</span>
                <button onclick="mark('${s._id}', 'present')" class="secondary" style="margin-left:10px; padding: 2px 8px; font-size: 0.8rem;">P</button>
                <button onclick="mark('${s._id}', 'absent')" class="secondary" style="margin-left:5px; padding: 2px 8px; font-size: 0.8rem; border-color: var(--error-color); color: var(--error-color);">A</button>
            </div>
        `;
        studentList.appendChild(li);
    });
}

// Global function for onclick
window.mark = (studentId, status) => {
    ws.send(JSON.stringify({
        event: "ATTENDANCE_MARKED",
        data: { studentId, status }
    }));
};

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
});

// Student Actions
if (document.getElementById("refresh-status-btn")) {
    document.getElementById("refresh-status-btn").addEventListener("click", () => {
         ws.send(JSON.stringify({ event: "MY_ATTENDANCE" }));
    });
}

init();
